"""Response Safety Validator.

Runs deterministic checks before returning a response to the patient (spec section 39). If
a response fails, the orchestrator regenerates once with stricter
constraints; if it still fails, a predefined generic fallback is used
instead - never fabricated personal content.
"""

from __future__ import annotations

import re

from pydantic import BaseModel

from app.ai.stage_engine import StagePolicy
from app.ai.strategy_engine import StrategyDecision

_INTERNAL_METADATA_PATTERNS = [
    r"distress score",
    r"risk score",
    r"interaction risk",
    r"strategy engine",
    r"consent",
    r"embedding",
    r"vector",
    r"confidence",
    r"aiMayMention",
    r"safety engine",
    r"llm",
    r"system prompt",
]

_MEDICAL_CLAIM_PATTERNS = [
    r"you have dementia",
    r"you have alzheimer",
    r"diagnos",
    r"stage of dementia",
    r"take your medication",
    r"prescri",
    r"your condition is",
]

_CONFIRMATION_PATTERNS = [
    r"\byes,? (he|she|they) (is|are)\b",
    r"\byou'?re right,? (he|she|they)\b",
    r"\bthat'?s true\b",
]

SAFE_FALLBACK_GENERIC = "I'm here with you. Let's take things one moment at a time."
SAFE_FALLBACK_EMERGENCY = "I'm right here with you, and I'm getting your caregiver to help you now."
SAFE_FALLBACK_STT_FAILURE = "I didn't quite catch that. Would you like to try again?"


class ValidationResult(BaseModel):
    passed: bool
    violations: list[str]


def _sentence_count(text: str) -> int:
    return len([s for s in re.split(r"[.!?]+", text) if s.strip()])


def validate_response(
    response_text: str,
    stage_policy: StagePolicy,
    strategy: StrategyDecision,
    restricted_memory_snippets: list[str] | None = None,
) -> ValidationResult:
    violations: list[str] = []
    lowered = response_text.lower()
    restricted_memory_snippets = restricted_memory_snippets or []

    if _sentence_count(response_text) > stage_policy.maxSentences:
        violations.append("response_too_long_for_stage")

    for snippet in restricted_memory_snippets:
        if snippet and snippet.lower() in lowered:
            violations.append("restricted_memory_disclosed")
            break

    for pattern in _INTERNAL_METADATA_PATTERNS:
        if re.search(pattern, lowered):
            violations.append("internal_metadata_exposed")
            break

    for pattern in _MEDICAL_CLAIM_PATTERNS:
        if re.search(pattern, lowered):
            violations.append("unsupported_medical_claim")
            break

    if "direct_confirmation" in strategy.avoid or "confrontational_correction" in strategy.avoid:
        for pattern in _CONFIRMATION_PATTERNS:
            if re.search(pattern, lowered):
                violations.append("unsafe_belief_confirmed")
                break

    if not response_text.strip():
        violations.append("empty_response")

    return ValidationResult(passed=len(violations) == 0, violations=violations)
