"""Patient CRUD business logic (spec section 12). Deletion is a soft
archive, not a hard delete, for healthcare-adjacent data.

The website's wire field name `stage` is translated to/from the Firestore
field `configuredStage` here - every AI engine and test relies on the
`configuredStage` name, so it stays canonical in storage.
"""

from __future__ import annotations

import datetime as dt

from app.core.audit import audit_log
from app.core.exceptions import PatientNotFoundError
from app.database.repositories.conversation_repository import ConversationEventRepository
from app.database.repositories.patient_repository import PatientRepository
from app.schemas.patient import PatientCreateRequest, PatientUpdateRequest
from app.services.consent_service import ConsentService


def _compute_age(date_of_birth: dt.date) -> int:
    today = dt.date.today()
    years = today.year - date_of_birth.year
    if (today.month, today.day) < (date_of_birth.month, date_of_birth.day):
        years -= 1
    return years


def _normalize_for_response(patient: dict) -> dict:
    """Fill in the `stage` alias and a derived `age` for API responses,
    without mutating what's stored."""
    normalized = dict(patient)
    if "stage" not in normalized and "configuredStage" in normalized:
        normalized["stage"] = normalized["configuredStage"]
    if normalized.get("age") is None and normalized.get("dateOfBirth"):
        dob = normalized["dateOfBirth"]
        if isinstance(dob, str):
            dob = dt.date.fromisoformat(dob)
        if isinstance(dob, dt.date):
            normalized["age"] = _compute_age(dob)
    return normalized


class PatientService:
    def __init__(
        self,
        patient_repository: PatientRepository | None = None,
        conversation_event_repository: ConversationEventRepository | None = None,
        consent_service: ConsentService | None = None,
    ) -> None:
        self.patient_repository = patient_repository or PatientRepository()
        self.conversation_event_repository = conversation_event_repository or ConversationEventRepository()
        self.consent_service = consent_service or ConsentService()

    def create_patient(self, caregiver_uid: str, payload: PatientCreateRequest) -> dict:
        data = payload.model_dump(mode="json")
        data["preferredName"] = data.get("preferredName") or data["firstName"]
        data["primaryCaregiverId"] = caregiver_uid
        data["configuredStage"] = data.pop("stage")

        personal_data_consent = data.pop("personalDataConsent", True)
        ai_conversation_consent = data.pop("aiConversationConsent", True)
        emergency_escalation_consent = data.pop("emergencyEscalationConsent", True)

        if data.get("age") is None and data.get("dateOfBirth"):
            data["age"] = _compute_age(dt.date.fromisoformat(data["dateOfBirth"]))

        created = self.patient_repository.create(data)
        audit_log("patient_created", caregiver_uid, patient_id=created["id"])

        self.consent_service.update_consent(
            created["id"],
            {
                "personalDataCollection": personal_data_consent,
                "aiMayUseBiography": personal_data_consent,
                "aiConversationEnabled": ai_conversation_consent,
                "allowEmergencyEscalation": emergency_escalation_consent,
            },
        )

        return _normalize_for_response(created)

    def list_for_caregiver(self, caregiver_uid: str) -> list[dict]:
        return [_normalize_for_response(p) for p in self.patient_repository.list_for_caregiver(caregiver_uid)]

    def get_patient(self, patient_id: str, include_last_interaction: bool = False) -> dict:
        patient = self.patient_repository.get(patient_id)
        if not patient or patient.get("archived"):
            raise PatientNotFoundError("Patient profile was not found.")

        if include_last_interaction:
            recent = self.conversation_event_repository.recent_for_patient(patient_id, limit=1)
            if recent:
                created_at = recent[0].get("createdAt")
                if hasattr(created_at, "isoformat"):
                    patient = {**patient, "lastInteraction": created_at.isoformat()}

        return _normalize_for_response(patient)

    def update_patient(self, actor_uid: str, patient_id: str, payload: PatientUpdateRequest) -> dict:
        data = {k: v for k, v in payload.model_dump(mode="json").items() if v is not None}
        if "stage" in data:
            data["configuredStage"] = data.pop("stage")
        if data:
            self.patient_repository.update(patient_id, data)
            audit_log("patient_updated", actor_uid, patient_id=patient_id, fields=list(data.keys()))
        return self.get_patient(patient_id)

    def archive_patient(self, actor_uid: str, patient_id: str) -> None:
        self.get_patient(patient_id)
        self.patient_repository.archive(patient_id)
        audit_log("patient_archived", actor_uid, patient_id=patient_id)
