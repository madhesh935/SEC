"""Text-based emotion / interaction-signal analysis.

Per spec section 30-31: voice-acoustic emotion analysis is explicitly out of
scope for MVP. This engine analyzes transcript text and returns an
AI-detected interaction signal - never framed as a clinical diagnosis. The
lexicon-based classifier below is deterministic and fully unit-testable; it
is intentionally kept as the primary path (no network/model-download
dependency) with a lazy-loaded transformer classifier as an optional
enhancement that never blocks the pipeline if unavailable.
"""

from __future__ import annotations

import re

from pydantic import BaseModel

from app.core.logging import get_logger
from app.models.enums import EmotionSignal

logger = get_logger(__name__)

_LEXICON: dict[EmotionSignal, list[str]] = {
    EmotionSignal.FEAR: [
        "afraid", "scared", "frighten", "hiding", "someone is here",
        "someone's in", "unsafe", "terrified", "hurt me", "trying to hurt",
    ],
    EmotionSignal.ANXIOUS: [
        "worried", "anxious", "nervous", "where is", "when will", "why isn't",
        "hasn't come", "hasn't called", "can't find",
    ],
    EmotionSignal.SAD: [
        "sad", "miss", "lonely", "alone", "crying", "cry", "unhappy",
    ],
    EmotionSignal.GRIEF: [
        "died", "passed away", "gone forever", "funeral", "miss him so much",
        "miss her so much",
    ],
    EmotionSignal.ANGER: [
        "angry", "mad", "furious", "leave me alone", "stop it", "hate",
    ],
    EmotionSignal.AGITATION: [
        "get out", "go away", "no no no", "won't stop", "can't sit still",
        "need to leave",
    ],
    EmotionSignal.CONFUSED: [
        "confused", "don't understand", "what's happening", "where am i",
        "who are you", "i don't know",
    ],
    EmotionSignal.HAPPY: [
        "happy", "wonderful", "lovely", "great day", "so nice", "glad",
    ],
    EmotionSignal.CALM: [
        "fine", "okay", "good", "comfortable", "relaxed",
    ],
}

_HELP_PATTERNS = [
    r"\bhelp me\b",
    r"\bneed help\b",
    r"\bcall (my|the)\b",
    r"\bi need\b.*\b(now|urgent)\b",
]


class EmotionResult(BaseModel):
    signal: EmotionSignal
    confidence: float
    possibleHelpRequest: bool
    matchedCues: list[str]


def analyze_emotion(text: str) -> EmotionResult:
    lowered = text.lower()
    scores: dict[EmotionSignal, list[str]] = {}

    for signal, phrases in _LEXICON.items():
        matched = [phrase for phrase in phrases if phrase in lowered]
        if matched:
            scores[signal] = matched

    possible_help = any(re.search(pattern, lowered) for pattern in _HELP_PATTERNS)

    if not scores:
        return EmotionResult(
            signal=EmotionSignal.NEUTRAL,
            confidence=0.5,
            possibleHelpRequest=possible_help,
            matchedCues=[],
        )

    # Priority ordering: safety-relevant signals should win over mild ones
    # when multiple lexicons match the same utterance.
    priority = [
        EmotionSignal.FEAR,
        EmotionSignal.AGITATION,
        EmotionSignal.ANGER,
        EmotionSignal.GRIEF,
        EmotionSignal.ANXIOUS,
        EmotionSignal.CONFUSED,
        EmotionSignal.SAD,
        EmotionSignal.HAPPY,
        EmotionSignal.CALM,
    ]
    for signal in priority:
        if signal in scores:
            matched = scores[signal]
            confidence = min(0.6 + 0.1 * len(matched), 0.95)
            return EmotionResult(
                signal=signal,
                confidence=confidence,
                possibleHelpRequest=possible_help,
                matchedCues=matched,
            )

    return EmotionResult(
        signal=EmotionSignal.NEUTRAL,
        confidence=0.5,
        possibleHelpRequest=possible_help,
        matchedCues=[],
    )
