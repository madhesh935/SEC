"""Critical safety tests for the full orchestrator pipeline (spec section 71).

All Firebase/LLM/ElevenLabs dependencies are replaced with in-memory fakes -
this suite must never touch a real external service.
"""

from __future__ import annotations

import datetime as dt

import numpy as np
import pytest

from app.ai.orchestrator import InteractionOrchestrator
from app.core.exceptions import LLMServiceError
from app.models.enums import DementiaStage


class FakePatientRepository:
    def __init__(self, patient: dict) -> None:
        self._patient = patient

    def get(self, patient_id: str) -> dict:
        return dict(self._patient)


class FakeFamilyRepository:
    def list_patient_visible(self, patient_id: str) -> list[dict]:
        return []


class FakeMemoryRepository:
    def __init__(self, memories: list[dict]) -> None:
        self._memories = memories

    def list_ai_usable(self, patient_id: str) -> list[dict]:
        return self._memories


class FakeConversationRepository:
    def get_or_create(self, patient_id: str, conversation_id: str | None) -> dict:
        return {"id": conversation_id or "conv-1"}


class FakeConversationEventRepository:
    def __init__(self) -> None:
        self.created: list[dict] = []

    def recent_for_conversation(self, patient_id: str, conversation_id: str, limit: int = 6) -> list[dict]:
        return []

    def create(self, patient_id: str, data: dict) -> dict:
        self.created.append(data)
        return {**data, "id": f"evt-{len(self.created)}"}


class FakeRepetitionEventRepository:
    def __init__(self) -> None:
        self.created: list[dict] = []

    def create(self, patient_id: str, data: dict) -> dict:
        self.created.append(data)
        return {**data, "id": "rep-1"}


class FakeDistressEventRepository:
    def __init__(self) -> None:
        self.created: list[dict] = []

    def since(self, patient_id: str, since: dt.datetime, limit: int = 500) -> list[dict]:
        return []

    def create(self, patient_id: str, data: dict) -> dict:
        self.created.append(data)
        return {**data, "id": "dist-1"}


class FakeConsentRepository:
    def __init__(self, consent: dict) -> None:
        self._consent = consent

    def get(self, patient_id: str) -> dict:
        return dict(self._consent)


class FakeAlertRepository:
    def __init__(self) -> None:
        self.created: list[dict] = []

    def create(self, patient_id: str, data: dict) -> dict:
        self.created.append(data)
        return {**data, "id": "alert-1"}


class FakeAlertGroupRepository:
    pass


class FakeNotificationService:
    def __init__(self) -> None:
        self.notified: list[tuple] = []

    def notify_caregiver_of_alert(self, caregiver_uid: str, alert_id: str, patient_id: str) -> None:
        self.notified.append((caregiver_uid, alert_id, patient_id))


class FakeEmbeddingEngine:
    """Returns a fixed direction for every input so memory-retrieval
    similarity is deterministic (1.0) regardless of transcript wording -
    embedding *quality* is covered separately in test_repetition_engine.py.
    These safety tests only need retrieval to reliably happen."""

    def embed_text(self, text: str) -> np.ndarray:
        vector = np.ones(16)
        return vector / np.linalg.norm(vector)


class FakeLLMService:
    def __init__(self, responses: list[str] | None = None, always_raise: bool = False) -> None:
        self._responses = responses or ["I'm here with you."]
        self._call_count = 0
        self._always_raise = always_raise

    async def generate_patient_response(self, system_prompt: str, user_utterance: str) -> str:
        if self._always_raise:
            raise LLMServiceError("LLM unavailable")
        response = self._responses[min(self._call_count, len(self._responses) - 1)]
        self._call_count += 1
        return response


class FakeSTTService:
    async def transcribe(self, *args, **kwargs):
        raise AssertionError("STT should not be called for text conversations")


class FakeTTSService:
    async def synthesize(self, text: str, patient_id: str):
        return None


def _patient() -> dict:
    return {
        "id": "patient-1",
        "firstName": "Ruth",
        "preferredName": "Ruth",
        "preferredLanguage": "en",
        "configuredStage": DementiaStage.MID.value,
        "archived": False,
        "primaryCaregiverId": "caregiver-1",
    }


def _build_orchestrator(
    memories: list[dict],
    consent: dict,
    llm_service: FakeLLMService,
    alert_repository: FakeAlertRepository,
    notification_service: FakeNotificationService,
) -> InteractionOrchestrator:
    from app.services.alert_service import AlertService
    from app.services.consent_service import ConsentService

    alert_service = AlertService(
        alert_repository=alert_repository,
        alert_group_repository=FakeAlertGroupRepository(),
        patient_repository=FakePatientRepository(_patient()),
        notification_service=notification_service,
    )
    consent_service = ConsentService(consent_repository=FakeConsentRepository(consent))

    return InteractionOrchestrator(
        patient_repository=FakePatientRepository(_patient()),
        family_repository=FakeFamilyRepository(),
        memory_repository=FakeMemoryRepository(memories),
        conversation_repository=FakeConversationRepository(),
        conversation_event_repository=FakeConversationEventRepository(),
        repetition_event_repository=FakeRepetitionEventRepository(),
        distress_event_repository=FakeDistressEventRepository(),
        consent_service=consent_service,
        alert_service=alert_service,
        embedding_engine=FakeEmbeddingEngine(),
        llm_service=llm_service,
        stt_service=FakeSTTService(),
        tts_service=FakeTTSService(),
    )


@pytest.mark.asyncio
async def test_restricted_memory_is_never_disclosed_even_if_llm_leaks_it():
    restricted_memory = {
        "id": "mem-1",
        "title": "A difficult hospital stay",
        "description": "a difficult surgery in 1998 that upset the family",
        "embedding": [0.1] * 16,
        "approved": True,
        "aiMayKnowInternally": True,
        "aiMayMentionDirectly": False,
        "useForRedirection": False,
    }
    consent = {"aiMayUseBiography": True, "aiMayUseMemoryInternally": True, "aiMayMentionMemoryDirectly": False}
    leaking_llm = FakeLLMService(responses=["Let's talk about a difficult surgery in 1998 that upset the family."])

    orchestrator = _build_orchestrator(
        [restricted_memory], consent, leaking_llm, FakeAlertRepository(), FakeNotificationService()
    )

    result = await orchestrator.process_interaction("patient-1", None, text="How are you feeling today?")

    assert "1998" not in result.responseText
    assert "surgery" not in result.responseText.lower()


@pytest.mark.asyncio
async def test_llm_failure_returns_generic_fallback_without_fabricating_facts():
    consent = {"aiMayUseBiography": True, "aiMayUseMemoryInternally": True}
    orchestrator = _build_orchestrator(
        [], consent, FakeLLMService(always_raise=True), FakeAlertRepository(), FakeNotificationService()
    )

    result = await orchestrator.process_interaction("patient-1", None, text="Where is my daughter?")

    assert result.responseText
    assert "daughter" not in result.responseText.lower()
    assert result.status == "success"


@pytest.mark.asyncio
async def test_emergency_language_creates_urgent_alert_and_notifies_caregiver():
    consent = {"aiMayUseBiography": True, "aiMayUseMemoryInternally": True}
    alert_repository = FakeAlertRepository()
    notification_service = FakeNotificationService()
    orchestrator = _build_orchestrator(
        [], consent, FakeLLMService(), alert_repository, notification_service
    )

    await orchestrator.process_interaction("patient-1", None, text="I fell and I can't breathe, help me.")

    assert len(alert_repository.created) == 1
    assert alert_repository.created[0]["severity"] == "URGENT"
    assert len(notification_service.notified) == 1


@pytest.mark.asyncio
async def test_low_distress_calm_interaction_does_not_create_alert():
    consent = {"aiMayUseBiography": True, "aiMayUseMemoryInternally": True}
    alert_repository = FakeAlertRepository()
    orchestrator = _build_orchestrator(
        [], consent, FakeLLMService(responses=["What a lovely day."]), alert_repository, FakeNotificationService()
    )

    await orchestrator.process_interaction("patient-1", None, text="I had a wonderful cup of tea today.")

    assert len(alert_repository.created) == 0
