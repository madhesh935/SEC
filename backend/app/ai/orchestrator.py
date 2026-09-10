"""Interaction Orchestrator - coordinates the full GeriCare pipeline.

This is the only place that sequences the engines together (spec section
40). Route handlers must not contain this logic themselves. Each engine
remains independently unit-testable; this module only wires them together
and handles persistence/alerting side effects.
"""

from __future__ import annotations

from pydantic import BaseModel, Field

from app.ai.distress_engine import score_distress
from app.ai.embeddings import EmbeddingEngine
from app.ai.emotion_engine import analyze_emotion
from app.ai.intent_engine import extract_intent
from app.ai.llm_service import LLMService
from app.ai.memory_engine import retrieve_relevant_memories, structured_family_lookup
from app.ai.pattern_engine import (
    compute_hourly_distribution,
    identify_high_risk_windows,
    is_hour_in_high_risk_window,
)
from app.ai.repetition_engine import RecentUtterance, analyze_repetition
from app.ai.response_validator import (
    SAFE_FALLBACK_EMERGENCY,
    SAFE_FALLBACK_GENERIC,
    validate_response,
)
from app.ai.safety_engine import assess_safety
from app.ai.speech.stt import SpeechToTextService
from app.ai.stage_engine import get_stage_policy
from app.ai.strategy_engine import StrategyDecision, decide_strategy
from app.config import get_settings
from app.core.exceptions import LLMServiceError, PatientNotFoundError, ValidationError
from app.core.logging import get_logger
from app.database.repositories.conversation_repository import (
    ConversationEventRepository,
    ConversationRepository,
)
from app.database.repositories.event_repository import (
    DistressEventRepository,
    RepetitionEventRepository,
)
from app.database.repositories.family_repository import FamilyRepository
from app.database.repositories.memory_repository import MemoryRepository
from app.database.repositories.patient_repository import PatientRepository
from app.models.enums import DementiaStage, ResponseStrategy, UiMode
from app.schemas.patient_experience import PatientAction
from app.services.alert_service import AlertService
from app.services.consent_service import ConsentService
from app.utils.datetime import days_ago, utcnow

logger = get_logger(__name__)


class InteractionResult(BaseModel):
    actions: list[PatientAction] = Field(default_factory=list)
    conversationId: str
    transcript: str
    responseText: str
    responseAudioUrl: str | None
    status: str
    uiMode: str


class InteractionOrchestrator:
    def __init__(
        self,
        patient_repository: PatientRepository | None = None,
        family_repository: FamilyRepository | None = None,
        memory_repository: MemoryRepository | None = None,
        conversation_repository: ConversationRepository | None = None,
        conversation_event_repository: ConversationEventRepository | None = None,
        repetition_event_repository: RepetitionEventRepository | None = None,
        distress_event_repository: DistressEventRepository | None = None,
        consent_service: ConsentService | None = None,
        alert_service: AlertService | None = None,
        embedding_engine: EmbeddingEngine | None = None,
        llm_service: LLMService | None = None,
        stt_service: SpeechToTextService | None = None,
    ) -> None:
        self.patient_repository = patient_repository or PatientRepository()
        self.family_repository = family_repository or FamilyRepository()
        self.memory_repository = memory_repository or MemoryRepository()
        self.conversation_repository = conversation_repository or ConversationRepository()
        self.conversation_event_repository = (
            conversation_event_repository or ConversationEventRepository()
        )
        self.repetition_event_repository = (
            repetition_event_repository or RepetitionEventRepository()
        )
        self.distress_event_repository = distress_event_repository or DistressEventRepository()
        self.consent_service = consent_service or ConsentService()
        self.alert_service = alert_service or AlertService()
        self.embedding_engine = embedding_engine or EmbeddingEngine()
        self.llm_service = llm_service or LLMService()
        self.stt_service = stt_service or SpeechToTextService()

    async def process_interaction(
        self,
        patient_id: str,
        conversation_id: str | None,
        *,
        text: str | None = None,
        audio_bytes: bytes | None = None,
        audio_filename: str | None = None,
        audio_content_type: str | None = None,
    ) -> InteractionResult:
        patient = self.patient_repository.get(patient_id)
        if not patient or patient.get("archived"):
            raise PatientNotFoundError("Patient profile was not found.")

        consent = self.consent_service.get_consent(patient_id)
        if not self.consent_service.is_ai_conversation_enabled(consent):
            return InteractionResult(
                conversationId=conversation_id or "",
                transcript="",
                responseText="Your companion is turned off. Please ask your caregiver.",
                responseAudioUrl=None,
                status="ai_disabled",
                uiMode="normal",
            )

        transcript = text
        if audio_bytes is not None:
            transcript = await self.stt_service.transcribe(
                audio_bytes, audio_filename or "audio", audio_content_type or "audio/webm"
            )
            if not transcript:
                return InteractionResult(
                    conversationId=conversation_id or "",
                    transcript="",
                    responseText="",
                    responseAudioUrl=None,
                    status="speech_not_understood",
                    uiMode=UiMode.NORMAL.value,
                )
        if not transcript or not transcript.strip():
            raise ValidationError("No speech or text was provided.")

        settings = get_settings()
        conversation = self.conversation_repository.get_or_create(patient_id, conversation_id)
        conversation_id = conversation["id"]

        stage = DementiaStage(patient.get("configuredStage", DementiaStage.EARLY.value))
        stage_policy = get_stage_policy(stage)

        intent = extract_intent(transcript)
        emotion = analyze_emotion(transcript)
        query_embedding = self.embedding_engine.embed_text(transcript)

        recent_events = self.conversation_event_repository.recent_for_conversation(
            patient_id, conversation_id, limit=6
        )
        recent_utterances = [
            RecentUtterance(
                text=e["transcript"], embedding=e["embedding"], created_at=e["createdAt"]
            )
            for e in recent_events
            if e.get("embedding") and e.get("createdAt")
        ]
        repetition = analyze_repetition(
            transcript,
            query_embedding,
            recent_utterances,
            threshold=settings.repetition_similarity_threshold,
        )
        recent_strategies = [
            ResponseStrategy(s)
            for e in recent_events
            for s in e.get("strategies", [])
            if s in ResponseStrategy._value2member_map_
        ]

        referenced_family_member = None
        if intent.referencedPersonName and self.consent_service.is_biography_allowed_for_ai(
            consent
        ):
            family_members = self.family_repository.list_patient_visible(patient_id)
            referenced_family_member = structured_family_lookup(
                intent.referencedPersonName, family_members
            )

        memories = []
        if self.consent_service.is_biography_allowed_for_ai(consent):
            all_memories = self.memory_repository.list_ai_usable(patient_id)
            usable = [
                m for m in all_memories if self.consent_service.is_memory_allowed_for_ai(m, consent)
            ]
            memories = retrieve_relevant_memories(query_embedding, usable)
            for memory in memories:
                memory.mayMentionDirectly = bool(
                    memory.mayMentionDirectly and consent.get("aiMayMentionMemoryDirectly", False)
                )

        has_relevant_memory = bool(memories) or referenced_family_member is not None
        memory_may_mention = bool(referenced_family_member) or any(
            m.mayMentionDirectly and consent.get("aiMayMentionMemoryDirectly", False)
            for m in memories
        )

        recent_distress_events = self.distress_event_repository.since(patient_id, days_ago(1))
        scores = [e.get("distressScore", 0) for e in recent_distress_events]
        recent_distress_average = sum(scores) / len(scores) if scores else 0.0

        hourly = compute_hourly_distribution(recent_distress_events)
        windows = identify_high_risk_windows(
            hourly, threshold=float(settings.distress_alert_threshold)
        )
        is_evening_window = is_hour_in_high_risk_window(utcnow().hour, windows)

        safety = assess_safety(transcript, emotion.matchedCues)

        distress = score_distress(
            emotion_signal=emotion.signal,
            is_repeated=repetition.isRepeated,
            recent_repetition_count=repetition.recentCount,
            possible_help_request=intent.possibleHelpRequest or emotion.possibleHelpRequest,
            recent_distress_average=recent_distress_average,
            is_evening_high_risk_window=is_evening_window,
            safety_fear_level=safety.fearLevel,
            emergency_detected=safety.emergencyDetected,
        )

        strategy = decide_strategy(
            stage=stage,
            stage_policy=stage_policy,
            intent=intent,
            repetition=repetition,
            emotion=emotion,
            distress=distress,
            safety=safety,
            has_relevant_memory=has_relevant_memory,
            memory_may_mention=memory_may_mention,
            recent_strategies=recent_strategies,
        )

        system_prompt = self._build_system_prompt(
            patient=patient,
            stage_policy=stage_policy,
            strategy=strategy,
            memories=memories,
            referenced_family_member=referenced_family_member,
            consent=consent,
        )

        fallback_text = (
            SAFE_FALLBACK_EMERGENCY if safety.emergencyDetected else SAFE_FALLBACK_GENERIC
        )
        response_text = await self._generate_validated_response(
            system_prompt, transcript, stage_policy, strategy, memories, fallback_text
        )

        ui_mode = UiMode.NORMAL
        if strategy.escalate:
            ui_mode = UiMode.CAREGIVER_NOTIFIED
        elif ResponseStrategy.COMFORT_MODE in strategy.strategies:
            ui_mode = UiMode.COMFORT

        if safety.emergencyDetected:
            safety_status = "emergency"
        elif (
            safety.possibleFalseBeliefContext
            or safety.fearLevel in ("moderate", "high")
            or strategy.escalate
        ):
            safety_status = "caution"
        else:
            safety_status = "normal"

        event = self.conversation_event_repository.create(
            patient_id,
            {
                "conversationId": conversation_id,
                "transcript": transcript,
                "embedding": [float(x) for x in query_embedding],
                "intent": intent.intent,
                "topic": intent.topic,
                "emotion": emotion.signal.value,
                "repetitionCount": repetition.recentCount,
                "isRepeated": repetition.isRepeated,
                "distressScore": distress.score,
                "distressSeverity": distress.severity.value,
                "strategies": [s.value for s in strategy.strategies],
                "memoryIdsUsed": [m.id for m in memories],
                "retrievedMemoryTitle": memories[0].title if memories else None,
                "safetyStatus": safety_status,
                "safetyFlags": strategy.avoid,
                "uiMode": ui_mode.value,
                "responseText": response_text,
            },
        )

        if repetition.isRepeated:
            self.repetition_event_repository.create(
                patient_id,
                {
                    "conversationId": conversation_id,
                    "topic": repetition.semanticTopic,
                    "similarity": repetition.similarity,
                    "recentCount": repetition.recentCount,
                    "strategiesUsed": [s.value for s in strategy.strategies],
                },
            )

        self.distress_event_repository.create(
            patient_id,
            {
                "conversationId": conversation_id,
                "eventId": event.get("id"),
                "distressScore": distress.score,
                "severity": distress.severity.value,
                "contributingFactors": distress.contributingFactors,
                "emotion": emotion.signal.value,
            },
        )

        if self.consent_service.is_emergency_escalation_allowed(consent):
            self.alert_service.maybe_create_alert(
                patient_id, distress, strategy, safety, event.get("id")
            )

        return InteractionResult(
            conversationId=conversation_id,
            transcript=transcript,
            responseText=response_text,
            responseAudioUrl=None,
            status="success",
            uiMode=ui_mode.value,
        )

    async def _generate_validated_response(
        self,
        system_prompt: str,
        transcript: str,
        stage_policy,
        strategy: StrategyDecision,
        memories: list,
        fallback_text: str,
    ) -> str:
        restricted_snippets = [
            snippet
            for m in memories
            if not m.mayMentionDirectly
            for snippet in (m.title, m.description)
            if snippet
        ]

        try:
            response_text = await self.llm_service.generate_patient_response(
                system_prompt, transcript
            )
        except LLMServiceError:
            logger.warning("llm_generation_failed")
            raise

        validation = validate_response(response_text, stage_policy, strategy, restricted_snippets)
        if validation.passed:
            return response_text

        logger.info("response_validation_failed_retrying", violations=validation.violations)
        stricter_prompt = (
            system_prompt + f"\n\nSTRICT CONSTRAINT: Use at most {stage_policy.maxSentences} short "
            "sentence(s). Do not repeat, confirm, or reference any restricted "
            "or unverified information."
        )
        try:
            retry_text = await self.llm_service.generate_patient_response(
                stricter_prompt, transcript
            )
        except LLMServiceError:
            raise

        retry_validation = validate_response(
            retry_text, stage_policy, strategy, restricted_snippets
        )
        if retry_validation.passed:
            return retry_text

        logger.warning(
            "response_validation_failed_after_retry", violations=retry_validation.violations
        )
        return fallback_text

    def _build_system_prompt(
        self,
        patient: dict,
        stage_policy,
        strategy: StrategyDecision,
        memories: list,
        referenced_family_member: dict | None,
        consent: dict,
    ) -> str:
        name = patient.get("preferredName") or patient.get("firstName", "the patient")
        language = patient.get("preferredLanguage", "en")

        lines = [
            "You are GeriCare, a warm, calm voice companion for a person living with dementia.",
            f"Address them as {name}. Respond in language code: {language}.",
            f"Maximum {stage_policy.maxSentences} short sentence(s). Language "
            f"complexity: {stage_policy.languageComplexity}. "
            f"Speaking pace guidance: {stage_policy.pace}.",
            f"Tone: {strategy.tone}. Chosen response strategies: "
            f"{', '.join(s.value for s in strategy.strategies)}.",
            "You must strictly follow the chosen strategies and never invent facts.",
        ]

        if strategy.avoid:
            lines.append(f"Avoid: {', '.join(strategy.avoid)}.")

        if self.consent_service.is_biography_allowed_for_ai(consent):
            bio_fields = {
                "profession": patient.get("profession"),
                "hometown": patient.get("hometown"),
                "hobbies": patient.get("hobbies"),
                "favouriteMusic": patient.get("favouriteMusic"),
                "favouriteFood": patient.get("favouriteFood"),
                "dailyRoutine": patient.get("dailyRoutine"),
            }
            bio_facts = [f"{k}: {v}" for k, v in bio_fields.items() if v]
            if bio_facts:
                lines.append("Known approved biography facts you may use: " + "; ".join(bio_facts))

        if referenced_family_member:
            lines.append(
                f"The person asked about '{referenced_family_member.get('name')}', who is their "
                f"{referenced_family_member.get('relationship')}. You may mention "
                f"this relationship warmly."
            )

        for memory in memories:
            if memory.mayMentionDirectly:
                lines.append(
                    f"You may gently reference this approved memory if relevant: "
                    f"{memory.title} - {memory.description}"
                )
            else:
                lines.append(
                    f"A related memory exists ('{memory.title}') but you must NOT "
                    f"reveal its content directly - "
                    "use it only to inform a gentle, comforting tone."
                )

        if strategy.escalate:
            lines.append(
                "A caregiver is being notified. Keep your reply calm and "
                "reassuring; do not mention "
                "escalation, alerts, or that anyone has been notified."
            )

        lines.append("Never mention scores, strategies, consent, or any internal system details.")
        return "\n".join(lines)
