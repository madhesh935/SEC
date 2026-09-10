"""Response Strategy Engine - one of GeriCare's core innovations.

Combines stage policy, intent, repetition, emotion, distress, safety and
memory-availability signals into a structured strategy decision. The LLM
never sees these raw signals directly for decision-making purposes; it only
receives the resulting strategy to phrase naturally (spec section 35).
"""

from __future__ import annotations

from pydantic import BaseModel

from app.ai.distress_engine import DistressResult
from app.ai.emotion_engine import EmotionResult
from app.ai.intent_engine import IntentResult
from app.ai.repetition_engine import RepetitionResult
from app.ai.safety_engine import SafetyAssessment
from app.ai.stage_engine import StagePolicy
from app.models.enums import DementiaStage, DistressSeverity, EmotionSignal, ResponseStrategy

_DISTRESS_EMOTIONS = {
    EmotionSignal.FEAR,
    EmotionSignal.ANXIOUS,
    EmotionSignal.AGITATION,
    EmotionSignal.ANGER,
    EmotionSignal.GRIEF,
    EmotionSignal.SAD,
    EmotionSignal.CONFUSED,
}

_REPETITION_ROTATION = [
    ResponseStrategy.REASSURANCE,
    ResponseStrategy.MEMORY_REDIRECTION,
    ResponseStrategy.FAMILY_CONNECTION,
    ResponseStrategy.GENTLE_REORIENTATION,
    ResponseStrategy.COMFORT_MODE,
]


class StrategyDecision(BaseModel):
    strategies: list[ResponseStrategy]
    tone: str
    responseLength: str
    pace: str
    avoid: list[str]
    escalate: bool
    escalationReason: str | None = None


def _response_length_for(stage_policy: StagePolicy) -> str:
    if stage_policy.maxSentences <= 1:
        return "very_short"
    if stage_policy.maxSentences <= 2:
        return "short"
    return "moderate"


def _pick_repetition_strategy(recent_strategies: list[ResponseStrategy]) -> ResponseStrategy:
    for candidate in _REPETITION_ROTATION:
        if not recent_strategies or candidate != recent_strategies[-1]:
            return candidate
    return _REPETITION_ROTATION[0]


def decide_strategy(
    stage: DementiaStage,
    stage_policy: StagePolicy,
    intent: IntentResult,
    repetition: RepetitionResult,
    emotion: EmotionResult,
    distress: DistressResult,
    safety: SafetyAssessment,
    has_relevant_memory: bool,
    memory_may_mention: bool,
    recent_strategies: list[ResponseStrategy] | None = None,
) -> StrategyDecision:
    recent_strategies = recent_strategies or []
    avoid: list[str] = ["unverified_claims"]
    if stage_policy.avoidMemoryTesting:
        avoid.append("memory_testing")

    tone = "warm"
    response_length = _response_length_for(stage_policy)
    pace = stage_policy.pace
    escalate = False
    escalation_reason: str | None = None

    # Emergency boundary takes absolute priority (spec section 84).
    if safety.emergencyDetected:
        return StrategyDecision(
            strategies=[ResponseStrategy.REASSURANCE, ResponseStrategy.CAREGIVER_ESCALATION],
            tone="calm",
            responseLength="very_short",
            pace="slow",
            avoid=avoid + ["prolonged_conversation", "memory_testing"],
            escalate=True,
            escalationReason="Possible emergency or immediate safety language detected.",
        )

    strategies: list[ResponseStrategy] = []

    if safety.possibleFalseBeliefContext:
        strategies.append(ResponseStrategy.EMOTIONAL_VALIDATION)
        strategies.append(ResponseStrategy.REASSURANCE)
        avoid += ["direct_confirmation", "confrontational_correction", "ridicule"]
        tone = "calm"
        if has_relevant_memory and memory_may_mention:
            strategies.append(ResponseStrategy.MEMORY_REDIRECTION)
        else:
            strategies.append(ResponseStrategy.FAMILY_CONNECTION)
        if safety.callerEscalation:
            escalate = True
            escalation_reason = "Possible distressing unverified belief with high fear signal."

    elif emotion.signal in _DISTRESS_EMOTIONS:
        strategies.append(ResponseStrategy.EMOTIONAL_VALIDATION)
        strategies.append(ResponseStrategy.REASSURANCE)
        tone = "calm"
        if repetition.isRepeated:
            strategies.append(_pick_repetition_strategy(recent_strategies))
        elif has_relevant_memory and memory_may_mention:
            strategies.append(ResponseStrategy.MEMORY_REDIRECTION)
        elif stage_policy.allowMemoryPrompt:
            strategies.append(ResponseStrategy.GENTLE_REORIENTATION)

    elif repetition.isRepeated:
        strategies.append(_pick_repetition_strategy(recent_strategies))
        if has_relevant_memory and memory_may_mention:
            strategies.append(ResponseStrategy.MEMORY_REDIRECTION)

    else:
        strategies.append(ResponseStrategy.NORMAL_CONVERSATION)
        if stage_policy.allowMemoryPrompt and stage == DementiaStage.EARLY:
            strategies.append(ResponseStrategy.MEMORY_PROMPT)
        if intent.intent == "help_request":
            strategies.append(ResponseStrategy.CAREGIVER_ESCALATION)
            escalate = True
            escalation_reason = "Patient explicitly requested help."

    if stage == DementiaStage.LATE:
        strategies = [
            s
            for s in strategies
            if s not in (ResponseStrategy.MEMORY_PROMPT,)
        ]
        strategies.append(ResponseStrategy.COMFORT_MODE)

    distress_escalation_threshold = (
        DistressSeverity.MODERATE if stage_policy.earlierEscalation else DistressSeverity.HIGH
    )
    severity_order = [
        DistressSeverity.LOW,
        DistressSeverity.MODERATE,
        DistressSeverity.HIGH,
        DistressSeverity.URGENT,
    ]
    if severity_order.index(distress.severity) >= severity_order.index(distress_escalation_threshold):
        if ResponseStrategy.CAREGIVER_ESCALATION not in strategies:
            strategies.append(ResponseStrategy.CAREGIVER_ESCALATION)
        escalate = True
        escalation_reason = escalation_reason or f"Distress severity reached {distress.severity.value}."

    # De-duplicate while preserving order.
    seen = set()
    deduped = []
    for s in strategies:
        if s not in seen:
            seen.add(s)
            deduped.append(s)

    return StrategyDecision(
        strategies=deduped,
        tone=tone,
        responseLength=response_length,
        pace=pace,
        avoid=avoid,
        escalate=escalate,
        escalationReason=escalation_reason,
    )
