from app.ai.distress_engine import score_distress
from app.models.enums import DistressSeverity, EmotionSignal


def test_calm_neutral_interaction_scores_low():
    result = score_distress(
        emotion_signal=EmotionSignal.CALM,
        is_repeated=False,
        recent_repetition_count=0,
        possible_help_request=False,
        recent_distress_average=0,
        is_evening_high_risk_window=False,
        safety_fear_level="none",
        emergency_detected=False,
    )
    assert result.severity == DistressSeverity.LOW
    assert result.score < 30


def test_emergency_always_forces_urgent_severity():
    result = score_distress(
        emotion_signal=EmotionSignal.NEUTRAL,
        is_repeated=False,
        recent_repetition_count=0,
        possible_help_request=False,
        recent_distress_average=0,
        is_evening_high_risk_window=False,
        safety_fear_level="high",
        emergency_detected=True,
    )
    assert result.severity == DistressSeverity.URGENT


def test_contributing_factors_are_explainable():
    result = score_distress(
        emotion_signal=EmotionSignal.FEAR,
        is_repeated=True,
        recent_repetition_count=3,
        possible_help_request=True,
        recent_distress_average=50,
        is_evening_high_risk_window=True,
        safety_fear_level="moderate",
        emergency_detected=False,
    )
    assert set(result.contributingFactors.keys()) == {
        "emotion",
        "repetition",
        "help_request",
        "behaviour_history",
        "time_pattern",
        "safety",
    }
    assert len(result.explanation) > 0
