from app.ai.distress_engine import score_distress
from app.ai.emotion_engine import analyze_emotion
from app.ai.intent_engine import extract_intent
from app.ai.repetition_engine import RepetitionResult
from app.ai.safety_engine import assess_safety
from app.ai.stage_engine import get_stage_policy
from app.ai.strategy_engine import decide_strategy
from app.models.enums import DementiaStage, ResponseStrategy


def _no_repetition() -> RepetitionResult:
    return RepetitionResult(
        isRepeated=False, semanticTopic=None, similarity=0.0, recentCount=0, timeWindowMinutes=240
    )


def test_repeated_question_never_produces_hostile_strategy():
    intent = extract_intent("Where is my daughter?")
    emotion = analyze_emotion("Where is my daughter?")
    safety = assess_safety("Where is my daughter?")
    repetition = RepetitionResult(
        isRepeated=True,
        semanticTopic="Where is my daughter?",
        similarity=0.9,
        recentCount=4,
        timeWindowMinutes=240,
    )
    distress = score_distress(
        emotion.signal, True, 4, False, 20, False, safety.fearLevel, safety.emergencyDetected
    )
    decision = decide_strategy(
        DementiaStage.MID,
        get_stage_policy(DementiaStage.MID),
        intent,
        repetition,
        emotion,
        distress,
        safety,
        has_relevant_memory=True,
        memory_may_mention=True,
    )
    hostile_markers = {"you already asked", "again", "i told you"}
    assert not any(m in s.value.lower() for s in decision.strategies for m in hostile_markers)
    assert ResponseStrategy.CAREGIVER_ESCALATION not in decision.strategies or decision.escalate


def test_possible_hallucination_never_confirms_and_may_escalate():
    intent = extract_intent("Someone is hiding in my room and watching me, I'm scared.")
    emotion = analyze_emotion("Someone is hiding in my room and watching me, I'm scared.")
    safety = assess_safety(
        "Someone is hiding in my room and watching me, I'm scared.", emotion.matchedCues
    )
    distress = score_distress(
        emotion.signal, False, 0, False, 0, False, safety.fearLevel, safety.emergencyDetected
    )

    decision = decide_strategy(
        DementiaStage.MID,
        get_stage_policy(DementiaStage.MID),
        intent,
        _no_repetition(),
        emotion,
        distress,
        safety,
        has_relevant_memory=False,
        memory_may_mention=False,
    )

    assert "direct_confirmation" in decision.avoid
    assert "confrontational_correction" in decision.avoid
    assert ResponseStrategy.EMOTIONAL_VALIDATION in decision.strategies


def test_emergency_boundary_skips_normal_strategy_and_escalates():
    intent = extract_intent("I fell and I can't breathe.")
    emotion = analyze_emotion("I fell and I can't breathe.")
    safety = assess_safety("I fell and I can't breathe.")
    distress = score_distress(
        emotion.signal, False, 0, False, 0, False, safety.fearLevel, safety.emergencyDetected
    )

    decision = decide_strategy(
        DementiaStage.EARLY,
        get_stage_policy(DementiaStage.EARLY),
        intent,
        _no_repetition(),
        emotion,
        distress,
        safety,
        has_relevant_memory=False,
        memory_may_mention=False,
    )

    assert decision.escalate is True
    assert decision.responseLength == "very_short"
    assert ResponseStrategy.CAREGIVER_ESCALATION in decision.strategies


def test_high_distress_triggers_caregiver_escalation():
    intent = extract_intent("I don't know what's happening, I'm so scared and confused.")
    emotion = analyze_emotion("I don't know what's happening, I'm so scared and confused.")
    safety = assess_safety(
        "I don't know what's happening, I'm so scared and confused.", emotion.matchedCues
    )
    distress = score_distress(emotion.signal, True, 5, True, 80, True, safety.fearLevel, False)

    decision = decide_strategy(
        DementiaStage.EARLY,
        get_stage_policy(DementiaStage.EARLY),
        intent,
        RepetitionResult(
            isRepeated=True,
            semanticTopic="confusion",
            similarity=0.9,
            recentCount=5,
            timeWindowMinutes=240,
        ),
        emotion,
        distress,
        safety,
        has_relevant_memory=False,
        memory_may_mention=False,
    )

    assert decision.escalate is True
