from app.services.consent_service import ConsentService


def _memory(**overrides):
    base = {
        "approved": True,
        "aiMayKnowInternally": True,
        "aiMayMentionDirectly": False,
        "visibleToPatient": True,
        "useForRedirection": True,
    }
    base.update(overrides)
    return base


def _consent(**overrides):
    base = {
        "aiMayUseBiography": True,
        "aiMayUseMemoryInternally": True,
        "aiMayMentionMemoryDirectly": False,
        "patientMaySeeMemory": True,
    }
    base.update(overrides)
    return base


def test_sensitive_memory_not_allowed_for_ai_when_not_approved():
    memory = _memory(approved=False)
    assert ConsentService.is_memory_allowed_for_ai(memory, _consent()) is False


def test_memory_not_mentionable_when_ai_may_mention_false():
    memory = _memory(aiMayMentionDirectly=False)
    assert (
        ConsentService.may_mention_memory_directly(
            memory, _consent(aiMayMentionMemoryDirectly=True)
        )
        is False
    )


def test_memory_not_mentionable_when_global_consent_forbids_direct_mention():
    memory = _memory(aiMayMentionDirectly=True)
    assert (
        ConsentService.may_mention_memory_directly(
            memory, _consent(aiMayMentionMemoryDirectly=False)
        )
        is False
    )


def test_memory_mentionable_only_when_both_flags_allow_it():
    memory = _memory(aiMayMentionDirectly=True)
    assert (
        ConsentService.may_mention_memory_directly(
            memory, _consent(aiMayMentionMemoryDirectly=True)
        )
        is True
    )


def test_memory_blocked_from_ai_when_global_toggle_disabled():
    memory = _memory()
    assert (
        ConsentService.is_memory_allowed_for_ai(memory, _consent(aiMayUseMemoryInternally=False))
        is False
    )


def test_biography_blocked_when_consent_disabled():
    assert ConsentService.is_biography_allowed_for_ai(_consent(aiMayUseBiography=False)) is False


def test_ai_conversation_enabled_defaults_true():
    assert ConsentService.is_ai_conversation_enabled(_consent()) is True
    assert ConsentService.is_ai_conversation_enabled(_consent(aiConversationEnabled=False)) is False


def test_website_shape_round_trip():
    consent = _consent()
    website_shape = ConsentService.to_website_shape(consent, "patient-1")
    assert website_shape["patientId"] == "patient-1"
    assert website_shape["aiConversationUsage"] is True

    mapped = ConsentService.from_website_shape({"aiConversationUsage": False})
    assert mapped == {"aiConversationEnabled": False}
