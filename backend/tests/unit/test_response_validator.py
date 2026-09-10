from app.ai.response_validator import validate_response
from app.ai.stage_engine import get_stage_policy
from app.ai.strategy_engine import StrategyDecision
from app.models.enums import DementiaStage, ResponseStrategy


def _strategy(avoid=None) -> StrategyDecision:
    return StrategyDecision(
        strategies=[ResponseStrategy.REASSURANCE],
        tone="calm",
        responseLength="short",
        pace="slow",
        avoid=avoid or [],
        escalate=False,
    )


def test_response_too_long_for_stage_is_flagged():
    policy = get_stage_policy(DementiaStage.LATE)
    text = "This is one sentence. This is another sentence that should not be here."
    result = validate_response(text, policy, _strategy())
    assert result.passed is False
    assert "response_too_long_for_stage" in result.violations


def test_restricted_memory_content_leak_is_flagged():
    policy = get_stage_policy(DementiaStage.EARLY)
    text = "Your secret surgery in 1998 went well, don't worry."
    result = validate_response(text, policy, _strategy(), restricted_memory_snippets=["secret surgery in 1998"])
    assert result.passed is False
    assert "restricted_memory_disclosed" in result.violations


def test_internal_metadata_exposure_is_flagged():
    policy = get_stage_policy(DementiaStage.EARLY)
    text = "Your distress score is high right now."
    result = validate_response(text, policy, _strategy())
    assert result.passed is False
    assert "internal_metadata_exposed" in result.violations


def test_confirming_unverified_belief_is_flagged_when_avoided():
    policy = get_stage_policy(DementiaStage.MID)
    text = "Yes, he is on his way home right now."
    strategy = _strategy(avoid=["direct_confirmation"])
    result = validate_response(text, policy, strategy)
    assert result.passed is False
    assert "unsafe_belief_confirmed" in result.violations


def test_safe_short_response_passes():
    policy = get_stage_policy(DementiaStage.MID)
    text = "I'm right here with you."
    result = validate_response(text, policy, _strategy())
    assert result.passed is True
    assert result.violations == []
