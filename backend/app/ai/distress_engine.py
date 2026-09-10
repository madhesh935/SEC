"""Explainable, configurable-weight distress/interaction-risk scoring.

This is NOT a medically validated score. It is called "Distress Risk" /
"Observed Distress Signals" everywhere it surfaces to caregivers (spec
section 32-33). Every contributing factor is stored so caregivers can see
why a score changed.
"""

from __future__ import annotations

from pydantic import BaseModel

from app.config import get_settings
from app.models.enums import DistressSeverity, EmotionSignal

# Relative weights - deliberately simple/explainable for an MVP, not a
# clinically calibrated model (spec section 32).
_EMOTION_WEIGHTS: dict[EmotionSignal, float] = {
    EmotionSignal.FEAR: 30,
    EmotionSignal.AGITATION: 28,
    EmotionSignal.ANGER: 22,
    EmotionSignal.GRIEF: 20,
    EmotionSignal.ANXIOUS: 18,
    EmotionSignal.CONFUSED: 14,
    EmotionSignal.SAD: 12,
    EmotionSignal.NEUTRAL: 0,
    EmotionSignal.CALM: 0,
    EmotionSignal.HAPPY: 0,
}

_REPETITION_WEIGHT_PER_EVENT = 5
_REPETITION_WEIGHT_CAP = 20
_HELP_REQUEST_WEIGHT = 15
_BEHAVIOUR_HISTORY_WEIGHT = 15
_TIME_PATTERN_WEIGHT = 10
_SAFETY_FEAR_WEIGHTS = {"none": 0, "low": 5, "moderate": 15, "high": 30}
_EMERGENCY_WEIGHT = 40


class DistressResult(BaseModel):
    score: int
    severity: DistressSeverity
    contributingFactors: dict[str, float]
    explanation: list[str]


def score_distress(
    emotion_signal: EmotionSignal,
    is_repeated: bool,
    recent_repetition_count: int,
    possible_help_request: bool,
    recent_distress_average: float,
    is_evening_high_risk_window: bool,
    safety_fear_level: str,
    emergency_detected: bool,
) -> DistressResult:
    settings = get_settings()
    factors: dict[str, float] = {}
    explanation: list[str] = []

    emotion_contribution = _EMOTION_WEIGHTS.get(emotion_signal, 0)
    factors["emotion"] = emotion_contribution
    if emotion_contribution:
        explanation.append(f"Emotion signal '{emotion_signal.value}' contributed {emotion_contribution} points.")

    repetition_contribution = 0.0
    if is_repeated:
        repetition_contribution = min(
            recent_repetition_count * _REPETITION_WEIGHT_PER_EVENT, _REPETITION_WEIGHT_CAP
        )
        explanation.append(
            f"Semantic repetition detected ({recent_repetition_count} recent similar questions)."
        )
    factors["repetition"] = repetition_contribution

    help_contribution = _HELP_REQUEST_WEIGHT if possible_help_request else 0.0
    factors["help_request"] = help_contribution
    if help_contribution:
        explanation.append("Possible help-seeking statement detected.")

    behaviour_contribution = min(recent_distress_average / 100 * _BEHAVIOUR_HISTORY_WEIGHT, _BEHAVIOUR_HISTORY_WEIGHT)
    factors["behaviour_history"] = round(behaviour_contribution, 2)
    if behaviour_contribution > 5:
        explanation.append("Recent distress history is elevated.")

    time_contribution = _TIME_PATTERN_WEIGHT if is_evening_high_risk_window else 0.0
    factors["time_pattern"] = time_contribution
    if time_contribution:
        explanation.append("Current time falls within a previously observed higher-risk window.")

    safety_contribution = float(_SAFETY_FEAR_WEIGHTS.get(safety_fear_level, 0))
    if emergency_detected:
        safety_contribution += _EMERGENCY_WEIGHT
        explanation.append("Possible emergency / immediate safety language detected.")
    elif safety_contribution:
        explanation.append(f"Possible fear-related safety context (level: {safety_fear_level}).")
    factors["safety"] = safety_contribution

    raw_score = (
        emotion_contribution
        + repetition_contribution
        + help_contribution
        + behaviour_contribution
        + time_contribution
        + safety_contribution
    )
    score = int(min(max(raw_score, 0), 100))

    if emergency_detected or score >= settings.urgent_alert_threshold:
        severity = DistressSeverity.URGENT
    elif score >= settings.distress_alert_threshold:
        severity = DistressSeverity.HIGH
    elif score >= settings.distress_alert_threshold // 2:
        severity = DistressSeverity.MODERATE
    else:
        severity = DistressSeverity.LOW

    return DistressResult(
        score=score,
        severity=severity,
        contributingFactors=factors,
        explanation=explanation,
    )
