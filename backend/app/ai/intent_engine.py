"""Lightweight structured intent extraction.

Deterministic rules are used as the primary path so the pipeline never
depends on trusting malformed LLM JSON for this step (spec section 26).
Referenced-person resolution against structured family records happens in
the orchestrator, since this engine has no database access.
"""

from __future__ import annotations

import re

from pydantic import BaseModel

_QUESTION_WORDS = ("who", "what", "where", "when", "why", "how")

_HELP_PATTERNS = [r"\bhelp me\b", r"\bneed help\b", r"\bcall (my|the)\b"]
_CONFUSION_PATTERNS = [
    r"where am i",
    r"who are you",
    r"what('s| is) happening",
    r"i don'?t (know|remember)",
]
_GRIEF_PATTERNS = [r"\bdied\b", r"passed away", r"miss (him|her|them) so much"]


class IntentResult(BaseModel):
    intent: str  # "question" | "statement" | "help_request" | "distress_expression"
    referencedPersonName: str | None
    topic: str
    possibleConfusion: bool
    possibleFear: bool
    possibleGrief: bool
    possibleHelpRequest: bool


_NAME_PATTERN = re.compile(r"\b(?:my|is)\s+([A-Z][a-z]+)\b")
_WHERE_IS_PATTERN = re.compile(r"where('?s| is)\s+(my\s+)?([A-Za-z]+)", re.IGNORECASE)


def extract_intent(text: str) -> IntentResult:
    lowered = text.lower().strip()

    is_question = lowered.rstrip("?").endswith(_QUESTION_WORDS) or "?" in text or any(
        lowered.startswith(w) for w in _QUESTION_WORDS
    )
    possible_help = any(re.search(p, lowered) for p in _HELP_PATTERNS)
    possible_confusion = any(re.search(p, lowered) for p in _CONFUSION_PATTERNS)
    possible_grief = any(re.search(p, lowered) for p in _GRIEF_PATTERNS)
    possible_fear = "afraid" in lowered or "scared" in lowered or "frightened" in lowered

    referenced_person = None
    match = _WHERE_IS_PATTERN.search(text)
    if match:
        candidate = match.group(3)
        if candidate.lower() not in {"i", "it", "he", "she", "they", "here", "that"}:
            referenced_person = candidate

    if possible_help:
        intent = "help_request"
    elif possible_fear or possible_grief or possible_confusion:
        intent = "distress_expression"
    elif is_question:
        intent = "question"
    else:
        intent = "statement"

    topic = referenced_person or (lowered[:40] if lowered else "unknown")

    return IntentResult(
        intent=intent,
        referencedPersonName=referenced_person,
        topic=topic,
        possibleConfusion=possible_confusion,
        possibleFear=possible_fear,
        possibleGrief=possible_grief,
        possibleHelpRequest=possible_help,
    )
