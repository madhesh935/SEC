from app.ai.stage_engine import get_stage_policy
from app.models.enums import DementiaStage


def test_early_stage_allows_longer_responses():
    policy = get_stage_policy(DementiaStage.EARLY)
    assert policy.maxSentences >= 3
    assert policy.allowMemoryPrompt is True


def test_late_stage_is_short_and_avoids_memory_testing():
    policy = get_stage_policy(DementiaStage.LATE)
    assert policy.maxSentences == 1
    assert policy.avoidMemoryTesting is True
    assert policy.earlierEscalation is True


def test_mid_stage_has_high_repetition_tolerance():
    policy = get_stage_policy(DementiaStage.MID)
    assert policy.repetitionTolerance == "high"
