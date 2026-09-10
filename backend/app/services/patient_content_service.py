"""Consent-aware patient projections shared by pages, activities and recommendations."""

from __future__ import annotations

from urllib.parse import unquote, urlparse

from app.config import get_settings
from app.core.exceptions import ResourceNotFoundError
from app.database.repositories.family_repository import FamilyRepository
from app.database.repositories.memory_repository import MemoryRepository
from app.database.storage import signed_url
from app.schemas.family import FamilyMemberPublic
from app.schemas.memory import PatientMemoryPublic
from app.services.consent_service import ConsentService


class PatientContentService:
    def __init__(
        self, patient: dict, family_repository=None, memory_repository=None, consent_service=None
    ):
        self.patient = patient
        self.patient_id = patient["id"]
        self.family_repository = family_repository or FamilyRepository()
        self.memory_repository = memory_repository or MemoryRepository()
        self.consent_service = consent_service or ConsentService()
        self.consent = self.consent_service.get_consent(self.patient_id)

    def media_url(self, url: str | None) -> str | None:
        if not url:
            return None
        parsed = urlparse(url)
        if parsed.scheme != "https":
            return None
        bucket = get_settings().firebase_storage_bucket
        path = None
        if bucket and parsed.hostname == "storage.googleapis.com":
            prefix = f"/{bucket}/"
            if parsed.path.startswith(prefix):
                path = unquote(parsed.path[len(prefix) :])
        elif bucket and parsed.hostname == f"{bucket}.storage.googleapis.com":
            path = unquote(parsed.path.lstrip("/"))
        elif bucket and parsed.hostname == "firebasestorage.googleapis.com":
            prefix = f"/v0/b/{bucket}/o/"
            if parsed.path.startswith(prefix):
                path = unquote(parsed.path[len(prefix) :])
        if path is not None:
            allowed = (
                f"patients/{self.patient_id}/",
                f"uploads/{self.patient.get('primaryCaregiverId')}/",
            )
            if not path.startswith(allowed) or ".." in path.split("/"):
                return None
            return signed_url(path, expires_minutes=120)
        return url

    def family(self) -> list[FamilyMemberPublic]:
        if not self.consent.get("personalDataCollection", True):
            return []
        rows = self.family_repository.list_patient_visible(self.patient_id)
        result = []
        for row in sorted(rows, key=lambda item: item.get("priority", 999)):
            voice = (
                self.media_url(row.get("voiceRecordingUrl"))
                if self.consent.get("aiMayUseVoiceRecordings", False)
                else None
            )
            photo = (
                self.media_url(row.get("photoUrl"))
                if self.consent.get("photosUsage", True)
                else None
            )
            result.append(
                FamilyMemberPublic(
                    id=row["id"],
                    name=row["name"],
                    relationship=row.get("relationship"),
                    description=row.get("description"),
                    photoUrl=photo,
                    phoneNumber=row.get("phone"),
                    phoneAvailable=bool(row.get("phone")),
                    voiceMessageUrl=voice,
                    voiceMessageAvailable=bool(voice),
                )
            )
        return result

    def memories(self) -> list[PatientMemoryPublic]:
        if not (
            self.consent.get("personalDataCollection", True)
            and self.consent.get("memoriesUsage", True)
            and self.consent.get("patientMaySeeMemory", True)
        ):
            return []
        visible_family = {member.id: member for member in self.family()}
        result = []
        for row in self.memory_repository.list_patient_visible(self.patient_id):
            people = [
                visible_family[pid]
                for pid in row.get("associatedPeople", [])
                if pid in visible_family
            ]
            # Legacy names may identify visible members, but never expose unknown IDs/notes.
            people += [
                member
                for member in visible_family.values()
                if member.name in row.get("associatedPeople", []) and member not in people
            ]
            photos = self.consent.get("photosUsage", True)
            audio_allowed = row.get("category") in ("MUSIC", "RELAXING_SOUND") or self.consent.get(
                "aiMayUseVoiceRecordings", False
            )
            result.append(
                PatientMemoryPublic(
                    id=row["id"],
                    title=row["title"],
                    description=row.get("description"),
                    category=row.get("category", "OTHER"),
                    displayDate=row.get("displayDate"),
                    imageUrl=self.media_url(row.get("imageUrl")) if photos else None,
                    audioUrl=self.media_url(row.get("audioUrl")) if audio_allowed else None,
                    photoUrls=[
                        url for value in row.get("photoUrls", []) if (url := self.media_url(value))
                    ]
                    if photos
                    else [],
                    associatedPeople=[member.name for member in people],
                    people=people,
                )
            )
        return result

    def family_member(self, resource_id: str) -> FamilyMemberPublic:
        member = next((item for item in self.family() if item.id == resource_id), None)
        if not member:
            raise ResourceNotFoundError("Family member was not found.")
        return member

    def memory(self, resource_id: str) -> PatientMemoryPublic:
        memory = next((item for item in self.memories() if item.id == resource_id), None)
        if not memory:
            raise ResourceNotFoundError("Memory was not found.")
        return memory

    def comfort(self) -> list[dict]:
        items = []
        for memory in self.memories():
            if not (memory.audioUrl or memory.imageUrl):
                continue
            kind = (
                "music"
                if memory.category == "MUSIC"
                else "audio"
                if memory.category == "RELAXING_SOUND"
                else "memory"
                if memory.audioUrl
                else "photo"
            )
            items.append(
                dict(
                    id=f"memory:{memory.id}",
                    resourceId=memory.id,
                    type=kind,
                    title=memory.title,
                    description=memory.description,
                    imageUrl=memory.imageUrl,
                    mediaUrl=memory.audioUrl,
                )
            )
        for member in self.family():
            if member.voiceMessageUrl:
                items.append(
                    dict(
                        id=f"family:{member.id}",
                        resourceId=member.id,
                        type="voice",
                        title=f"A message from {member.name}",
                        imageUrl=member.photoUrl,
                        mediaUrl=member.voiceMessageUrl,
                    )
                )
        return items
