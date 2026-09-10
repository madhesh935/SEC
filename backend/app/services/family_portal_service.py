from __future__ import annotations

import datetime as dt
import secrets

from app.core.exceptions import AuthorizationError
from app.core.security import hash_pairing_code
from app.database.repositories.memory_repository import MemoryRepository
from app.database.repositories.patient_repository import PatientRepository
from app.database.repositories.portal_repository import (
    AccessRepository,
    FamilyNotificationRepository,
    InvitationRepository,
)
from app.database.repositories.user_repository import UserRepository
from app.schemas.memory import MemoryCreateRequest
from app.schemas.portal import (
    ConnectionSuggestion,
    FamilyContribution,
    FamilyMemory,
    FamilyNotification,
    FamilyPatient,
    InvitationRequest,
)
from app.services.consent_service import ConsentService
from app.services.memory_service import MemoryService
from app.services.patient_content_service import PatientContentService


class FamilyPortalService:
    def __init__(self):
        self.access = AccessRepository()
        self.invitations = InvitationRepository()
        self.patients = PatientRepository()
        self.users = UserRepository()
        self.memories = MemoryRepository()

    def invite(self, patient: dict, issuer: str, payload: InvitationRequest):
        token = secrets.token_urlsafe(32)
        expires = dt.datetime.now(dt.UTC) + dt.timedelta(hours=72)
        self.invitations.create(
            hash_pairing_code(token),
            dict(
                payload.model_dump(),
                patientId=patient["id"],
                issuer=issuer,
                email=payload.email.casefold(),
                expiresAt=expires,
            ),
        )
        return dict(token=token, email=payload.email, expiresAt=expires.isoformat())

    def authorize(self, uid: str, pid: str, permission: str = "viewProfile"):
        patient = self.patients.get(pid)
        grant = self.access.get(pid, uid)
        if not patient or patient.get("archived") or not grant or grant.get("status") != "active":
            raise AuthorizationError("You do not have active access to this loved one.")
        consent = ConsentService().get_consent(pid)
        if consent.get("familyAccessLevel") == "NONE" or not consent.get(
            "personalDataCollection", True
        ):
            raise AuthorizationError("Family access is currently unavailable.")
        if permission not in grant.get("permissions", []):
            raise AuthorizationError("Your caregiver has not enabled this permission.")
        return patient, grant

    def profile(self, uid: str, pid: str):
        patient, grant = self.authorize(uid, pid)
        content = PatientContentService(patient)
        biography = content.consent.get("aiMayUseBiography", True)
        caregiver = self.users.get(patient["primaryCaregiverId"]) or {}
        return FamilyPatient(
            id=pid,
            preferredName=patient.get("preferredName") or patient["firstName"],
            relationship=grant["relationship"],
            permissions=grant["permissions"],
            profilePhotoUrl=content.media_url(patient.get("profilePhotoUrl"))
            if content.consent.get("photosUsage", True)
            else None,
            preferredLanguage=patient.get("preferredLanguage"),
            profession=patient.get("profession") if biography else None,
            hometown=patient.get("hometown") if biography else None,
            hobbies=patient.get("hobbies", []) if biography else [],
            favouriteTopics=patient.get("favouriteTopics", []) if biography else [],
            caregiverName=caregiver.get("name"),
            caregiverEmail=caregiver.get("email"),
        )

    def list_patients(self, uid: str):
        result = []
        for pid in self.users.family_patient_ids(uid):
            try:
                result.append(self.profile(uid, pid))
            except AuthorizationError:
                continue
        return result

    def shared_memories(self, uid: str, pid: str):
        patient, _ = self.authorize(uid, pid, "viewMemories")
        content = PatientContentService(patient)
        if not content.consent.get("memoriesUsage", True):
            return []
        result = []
        for row in self.memories.list(pid, limit=200):
            own = row.get("createdBy") == uid
            shared = (
                row.get("approved")
                and row.get("visibleToSelectedFamily")
                and uid in row.get("familyUserIds", [])
            )
            if not (own or shared):
                continue
            result.append(
                FamilyMemory(
                    id=row["id"],
                    title=row["title"],
                    description=row["description"],
                    category=row["category"],
                    imageUrl=content.media_url(row.get("imageUrl"))
                    if content.consent.get("photosUsage", True)
                    else None,
                    audioUrl=content.media_url(row.get("audioUrl"))
                    if content.consent.get("aiMayUseVoiceRecordings", False)
                    or row["category"] in ("MUSIC", "RELAXING_SOUND")
                    else None,
                    displayDate=row.get("displayDate"),
                    reviewStatus="approved" if row.get("approved") else "pending",
                    contributedByYou=own,
                )
            )
        return result

    def contribute(self, uid: str, pid: str, payload: FamilyContribution):
        patient, _ = self.authorize(uid, pid, "contributeMemory")
        self.authorize(uid, pid, "viewMemories")
        if payload.imageUrl:
            self.authorize(uid, pid, "uploadPhoto")
        if payload.audioUrl:
            self.authorize(uid, pid, "uploadVoice")
        consent = ConsentService().get_consent(pid)
        if not consent.get("memoriesUsage", True):
            raise AuthorizationError("Memory sharing is turned off.")
        if payload.imageUrl and not consent.get("photosUsage", True):
            raise AuthorizationError("Photo sharing is turned off.")
        if payload.audioUrl and not consent.get("aiMayUseVoiceRecordings", False):
            raise AuthorizationError("Voice sharing is turned off.")
        request = MemoryCreateRequest(
            **payload.model_dump(),
            approved=False,
            visibleToPatient=False,
            aiMayKnowInternally=False,
            aiMayMentionDirectly=False,
            useForRedirection=False,
            visibleToSelectedFamily=False,
        )
        memory = MemoryService().create_memory(uid, pid, request)
        return next(m for m in self.shared_memories(uid, pid) if m.id == memory["id"])

    def suggestions(self, uid: str, pid: str):
        return [
            ConnectionSuggestion(
                id="memory:" + m.id, title=m.title, description=m.description, memoryId=m.id
            )
            for m in self.shared_memories(uid, pid)
            if m.reviewStatus == "approved"
        ][:3]

    def notifications(self, uid: str, pid: str):
        self.authorize(uid, pid, "viewUpdates")
        return [
            FamilyNotification(
                id=r["id"],
                title=r["title"],
                message=r["message"],
                createdAt=r["createdAt"].isoformat()
                if hasattr(r.get("createdAt"), "isoformat")
                else None,
            )
            for r in FamilyNotificationRepository().list(pid, limit=100)
            if r.get("userId") == uid
        ]
