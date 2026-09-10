"""Consent settings - single document per patient governing what the AI,
patient app, caregivers and family may access. Consent is enforced in
services/consent_service.py BEFORE any LLM call, never only in the UI."""

from __future__ import annotations

from typing import Any

from app.database.firebase import server_timestamp
from app.database.firestore import doc_to_dict, patient_doc, safe_call

DEFAULT_CONSENT: dict[str, Any] = {
    # Canonical fields, enforced by ConsentService/the orchestrator (spec section 15).
    "aiMayUseBiography": True,
    "aiMayUseMemoryInternally": True,
    "aiMayMentionMemoryDirectly": False,
    "aiMayUseVoiceRecordings": False,
    "aiConversationEnabled": True,
    "patientMaySeeMemory": True,
    "caregiverMayAccess": True,
    "familyMemberIdsWithAccess": [],
    "allowEmergencyEscalation": True,
    # Caregiver-website-facing fields. These share the same document (one
    # patient, one consent record) - see ConsentService for the two-way
    # translation. `photosUsage` and `dataRetentionDays` are stored for the
    # website's display/forms only; no automated retention/deletion job
    # currently reads dataRetentionDays, so it is not yet enforced.
    "personalDataCollection": True,
    "memoriesUsage": True,
    "photosUsage": True,
    "caregiverAccessLevel": "FULL",
    "familyAccessLevel": "APPROVED_ONLY",
    "dataRetentionDays": 365,
}


class ConsentRepository:
    def _doc(self, patient_id: str):
        return patient_doc(patient_id).collection("consents").document("default")

    def get(self, patient_id: str) -> dict[str, Any]:
        snapshot = safe_call(self._doc(patient_id).get)
        data = doc_to_dict(snapshot)
        if data is None:
            return {**DEFAULT_CONSENT, "patientId": patient_id}
        return {**DEFAULT_CONSENT, **data}

    def update(self, patient_id: str, data: dict[str, Any]) -> dict[str, Any]:
        payload = {**data, "updatedAt": server_timestamp()}
        safe_call(self._doc(patient_id).set, payload, merge=True)
        return self.get(patient_id)
