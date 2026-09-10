from app.ai.safety_engine import assess_safety


def test_hallucination_like_statement_never_confirms_belief():
    result = assess_safety("Someone is hiding in my room and watching me.")
    assert result.possibleFalseBeliefContext is True
    assert result.confirmUnverifiedClaim is False
    assert result.validateFear is True


def test_emergency_language_triggers_immediate_safety_risk():
    result = assess_safety("I fell and I can't breathe.")
    assert result.emergencyDetected is True
    assert result.immediateSafetyRisk is True
    assert result.callerEscalation is True
    assert result.confirmUnverifiedClaim is False


def test_neutral_statement_has_no_safety_flags():
    result = assess_safety("I had a lovely cup of tea this morning.")
    assert result.fearLevel == "none"
    assert result.possibleFalseBeliefContext is False
    assert result.callerEscalation is False


def test_deceased_relative_coming_home_flagged_without_confirmation():
    result = assess_safety("My husband is coming home soon, isn't he?")
    assert result.possibleFalseBeliefContext is True
    assert result.confirmUnverifiedClaim is False
    assert "direct_confirmation" in result.avoidTopics
