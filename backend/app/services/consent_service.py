"""Consent enforcement. Checked BEFORE any memory reaches the LLM (spec
section 15) - never relying on UI controls alone."""

from __future__ import annotations

from app.database.repositories.consent_repository import ConsentRepository


class ConsentService:
    def __init__(self, consent_repository: ConsentRepository | None = None) -> None:
        self.consent_repository = consent_repository or ConsentRepository()

    def get_consent(self, patient_id: str) -> dict:
        return self.consent_repository.get(patient_id)

    def update_consent(self, patient_id: str, data: dict) -> dict:
        return self.consent_repository.update(patient_id, data)

    @staticmethod
    def is_biography_allowed_for_ai(consent: dict) -> bool:
        return bool(consent.get("aiMayUseBiography", True))

    @staticmethod
    def is_memory_allowed_for_ai(memory: dict, consent: dict) -> bool:
        return (
            bool(consent.get("aiMayUseMemoryInternally", True))
            and bool(memory.get("approved"))
            and bool(memory.get("aiMayKnowInternally"))
        )

    @staticmethod
    def is_memory_allowed_for_patient(memory: dict, consent: dict) -> bool:
        return (
            bool(consent.get("patientMaySeeMemory", True))
            and bool(memory.get("approved"))
            and bool(memory.get("visibleToPatient"))
        )

    @classmethod
    def is_memory_allowed_for_redirection(cls, memory: dict, consent: dict) -> bool:
        return cls.is_memory_allowed_for_ai(memory, consent) and bool(
            memory.get("useForRedirection")
        )

    @classmethod
    def may_mention_memory_directly(cls, memory: dict, consent: dict) -> bool:
        return (
            cls.is_memory_allowed_for_ai(memory, consent)
            and bool(memory.get("aiMayMentionDirectly"))
            and bool(consent.get("aiMayMentionMemoryDirectly", False))
        )

    @staticmethod
    def is_voice_recording_allowed(consent: dict) -> bool:
        return bool(consent.get("aiMayUseVoiceRecordings", False))

    @staticmethod
    def is_emergency_escalation_allowed(consent: dict) -> bool:
        return bool(consent.get("allowEmergencyEscalation", True))

    @staticmethod
    def is_ai_conversation_enabled(consent: dict) -> bool:
        """Caregiver-website-facing 'aiConversationUsage' toggle. When
        disabled, the orchestrator refuses to run the pipeline at all rather
        than silently ignoring the caregiver's choice."""
        return bool(consent.get("aiConversationEnabled", True))

    @staticmethod
    def family_has_access(consent: dict, family_member_id: str) -> bool:
        return family_member_id in consent.get("familyMemberIdsWithAccess", [])

    @staticmethod
    def to_website_shape(consent: dict, patient_id: str) -> dict:
        """Translate the internal canonical consent document into the
        caregiver website's ConsentSettings shape. Both representations live
        in the same Firestore document - this is a read-time view, not a
        second source of truth."""
        return {
            "patientId": patient_id,
            "personalDataCollection": bool(consent.get("personalDataCollection", True)),
            "memoriesUsage": bool(
                consent.get("memoriesUsage", consent.get("aiMayUseMemoryInternally", True))
            ),
            "photosUsage": bool(consent.get("photosUsage", True)),
            "voiceRecordingsUsage": bool(consent.get("aiMayUseVoiceRecordings", False)),
            "aiConversationUsage": bool(consent.get("aiConversationEnabled", True)),
            "caregiverAccessLevel": consent.get("caregiverAccessLevel", "FULL"),
            "familyAccessLevel": consent.get("familyAccessLevel", "APPROVED_ONLY"),
            "emergencyEscalationEnabled": bool(consent.get("allowEmergencyEscalation", True)),
            "dataRetentionDays": consent.get("dataRetentionDays", 365),
        }

    @staticmethod
    def from_website_shape(data: dict) -> dict:
        """Translate an incoming website ConsentSettings PUT into canonical
        + website fields for storage. Unknown/omitted keys are left out so a
        partial update doesn't clobber fields the caller didn't send."""
        mapped: dict = {}
        if "personalDataCollection" in data:
            mapped["personalDataCollection"] = data["personalDataCollection"]
            mapped["aiMayUseBiography"] = data["personalDataCollection"]
        if "memoriesUsage" in data:
            mapped["memoriesUsage"] = data["memoriesUsage"]
            mapped["aiMayUseMemoryInternally"] = data["memoriesUsage"]
        if "photosUsage" in data:
            mapped["photosUsage"] = data["photosUsage"]
        if "voiceRecordingsUsage" in data:
            mapped["aiMayUseVoiceRecordings"] = data["voiceRecordingsUsage"]
        if "aiConversationUsage" in data:
            mapped["aiConversationEnabled"] = data["aiConversationUsage"]
        if "caregiverAccessLevel" in data:
            mapped["caregiverAccessLevel"] = data["caregiverAccessLevel"]
            mapped["caregiverMayAccess"] = data["caregiverAccessLevel"] == "FULL"
        if "familyAccessLevel" in data:
            mapped["familyAccessLevel"] = data["familyAccessLevel"]
        if "emergencyEscalationEnabled" in data:
            mapped["allowEmergencyEscalation"] = data["emergencyEscalationEnabled"]
        if "dataRetentionDays" in data:
            mapped["dataRetentionDays"] = data["dataRetentionDays"]
        return mapped
