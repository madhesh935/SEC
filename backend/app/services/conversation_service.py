"""Conversation orchestration entrypoints, help requests, and the patient
status / caregiver live-status projections (spec sections 24-25, 42, 46, 57).
"""

from __future__ import annotations

from app.ai.orchestrator import InteractionOrchestrator, InteractionResult
from app.ai.pattern_engine import compute_hourly_distribution, identify_high_risk_windows, is_hour_in_high_risk_window
from app.core.exceptions import PatientNotFoundError
from app.database.repositories.conversation_repository import ConversationEventRepository
from app.database.repositories.event_repository import DistressEventRepository, RepetitionEventRepository
from app.database.repositories.family_repository import FamilyRepository
from app.database.repositories.patient_repository import PatientRepository
from app.models.enums import AlertSeverity, DistressSeverity
from app.services.alert_service import AlertService
from app.utils.datetime import days_ago, hours_ago, utcnow


class ConversationService:
    def __init__(
        self,
        orchestrator: InteractionOrchestrator | None = None,
        conversation_event_repository: ConversationEventRepository | None = None,
        repetition_event_repository: RepetitionEventRepository | None = None,
        distress_event_repository: DistressEventRepository | None = None,
        patient_repository: PatientRepository | None = None,
        family_repository: FamilyRepository | None = None,
        alert_service: AlertService | None = None,
    ) -> None:
        self.orchestrator = orchestrator or InteractionOrchestrator()
        self.conversation_event_repository = conversation_event_repository or ConversationEventRepository()
        self.repetition_event_repository = repetition_event_repository or RepetitionEventRepository()
        self.distress_event_repository = distress_event_repository or DistressEventRepository()
        self.patient_repository = patient_repository or PatientRepository()
        self.family_repository = family_repository or FamilyRepository()
        self.alert_service = alert_service or AlertService()

    async def process_text(self, patient_id: str, conversation_id: str | None, text: str) -> InteractionResult:
        return await self.orchestrator.process_interaction(
            patient_id, conversation_id, text=text, synthesize_speech=False
        )

    async def process_voice(
        self,
        patient_id: str,
        conversation_id: str | None,
        audio_bytes: bytes,
        filename: str,
        content_type: str,
    ) -> InteractionResult:
        return await self.orchestrator.process_interaction(
            patient_id,
            conversation_id,
            audio_bytes=audio_bytes,
            audio_filename=filename,
            audio_content_type=content_type,
            synthesize_speech=True,
        )

    def create_help_request(self, patient_id: str, reason: str | None = None) -> dict:
        patient = self.patient_repository.get(patient_id)
        if not patient or patient.get("archived"):
            raise PatientNotFoundError("Patient profile was not found.")

        event = self.conversation_event_repository.create(
            patient_id,
            {
                "conversationId": None,
                "transcript": "",
                "intent": "help_request",
                "topic": "help_request",
                "emotion": "neutral",
                "repetitionCount": 0,
                "distressScore": 0,
                "distressSeverity": DistressSeverity.HIGH.value,
                "strategies": ["CAREGIVER_ESCALATION"],
                "memoryIdsUsed": [],
                "safetyFlags": [],
                "uiMode": "caregiver_notified",
                "responseText": "",
            },
        )
        self.alert_service.create_alert(
            patient_id,
            AlertSeverity.HIGH,
            reason or "Patient pressed the request-help button.",
            "The patient explicitly requested help via the companion app.",
            event.get("id"),
        )
        return {
            "success": True,
            "message": "Your caregiver has been notified.",
            "timestamp": utcnow().isoformat(),
        }

    def get_help_contacts(self, patient_id: str) -> dict:
        """Real contact info only - never fabricated. Fields the backend has
        no verified source for (e.g. live caregiver availability) are left
        unset rather than guessed."""
        patient = self.patient_repository.get(patient_id)
        if not patient or patient.get("archived"):
            raise PatientNotFoundError("Patient profile was not found.")

        contacts: dict = {}

        caregiver_id = patient.get("primaryCaregiverId")
        if caregiver_id:
            try:
                from firebase_admin import auth as firebase_auth

                caregiver = firebase_auth.get_user(caregiver_id)
                contacts["caregiverName"] = caregiver.display_name
                contacts["caregiverPhone"] = caregiver.phone_number
            except Exception:
                pass

        emergency_contacts = patient.get("emergencyContacts") or []
        primary = next((c for c in emergency_contacts if c.get("isPrimary")), None) or (
            emergency_contacts[0] if emergency_contacts else None
        )
        if primary:
            contacts["emergencyPhone"] = primary.get("phone")

        family_members = self.family_repository.list_patient_visible(patient_id)
        family_members.sort(key=lambda m: m.get("priority", 999))
        if family_members:
            top = family_members[0]
            contacts["familyContactName"] = top.get("name")
            contacts["familyContactPhone"] = top.get("phone")

        return contacts

    def get_live_status(self, patient_id: str) -> dict:
        recent = self.conversation_event_repository.recent_for_patient(patient_id, limit=1)
        if not recent:
            return {"isActive": False}

        latest = recent[0]
        created_at = latest.get("createdAt")
        is_active = False
        if created_at and hasattr(created_at, "timestamp"):
            is_active = created_at.timestamp() > hours_ago(1).timestamp()

        strategies = latest.get("strategies") or []
        patient = self.patient_repository.get(patient_id)

        return {
            "isActive": is_active,
            "currentSpeech": latest.get("transcript"),
            "intent": latest.get("intent"),
            "detectedEmotion": latest.get("emotion"),
            "repetitionCount": latest.get("repetitionCount", 0),
            "distressScore": latest.get("distressScore", 0),
            "retrievedMemory": latest.get("retrievedMemoryTitle"),
            "selectedStrategy": strategies[0] if strategies else None,
            "aiResponse": latest.get("responseText"),
            "safetyStatus": latest.get("safetyStatus", "normal"),
            "currentStage": patient.get("configuredStage") if patient else None,
            "sessionStartedAt": created_at.isoformat() if hasattr(created_at, "isoformat") else None,
        }

    def get_patient_status(self, patient_id: str) -> dict:
        today_start = utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_events = self.conversation_event_repository.list(
            patient_id, limit=500, order_by="createdAt", descending=True
        )
        today_events = [e for e in today_events if _created_after(e, today_start)]

        today_repetitions = self.repetition_event_repository.since(patient_id, today_start)
        latest_distress = self.distress_event_repository.latest(patient_id)

        recent_distress_events = self.distress_event_repository.since(patient_id, days_ago(3))
        hourly = compute_hourly_distribution(recent_distress_events)
        windows = identify_high_risk_windows(hourly, threshold=60.0)
        evening_pattern = "POSSIBLE" if any(18 <= w.hourRangeStart <= 21 for w in windows) else "NONE"

        distress_score = latest_distress.get("distressScore", 0) if latest_distress else 0
        distress_severity = latest_distress.get("severity", "LOW") if latest_distress else "LOW"
        current_state = "DISTRESSED" if distress_severity in ("HIGH", "URGENT") else "CALM"

        last_interaction_at = None
        if today_events:
            created_at = today_events[0].get("createdAt")
            if hasattr(created_at, "isoformat"):
                last_interaction_at = created_at.isoformat()

        return {
            "currentState": current_state,
            "distressScore": distress_score,
            "interactionsToday": len(today_events),
            "repeatedQuestions": len(today_repetitions),
            "eveningRisk": evening_pattern,
            "lastActiveTimestamp": last_interaction_at,
        }


def _created_after(event: dict, threshold) -> bool:
    created_at = event.get("createdAt")
    if created_at is None or not hasattr(created_at, "timestamp"):
        return False
    return created_at.timestamp() >= threshold.timestamp()
