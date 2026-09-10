"""Hallucination / delusion safety engine and emergency-boundary detection.

Core policy (spec section 34, 84): validate emotion, offer reassurance and
redirection toward comfort/safety, encourage trusted-person support - and
NEVER confirm an unverified belief, argue, ridicule, or run confrontational
memory tests. Immediate-danger language takes a separate, higher-priority
emergency path that skips normal conversational strategy entirely.
"""

from __future__ import annotations

import re

from pydantic import BaseModel

_POSSIBLE_HALLUCINATION_PATTERNS = [
    r"someone('s| is) (hiding|in my room|watching me|following me)",
    r"people (are|is) (trying to|going to) hurt me",
    r"\b(is|are) coming (home|back|to get me)\b",
    r"someone (stole|took) my",
    r"there('s| is) a (man|woman|person) (in|outside)",
]

_EMERGENCY_PATTERNS = [
    r"\bi('m| am)? fell\b",
    r"\bcan'?t breathe\b",
    r"\bchest pain\b",
    r"\bbleeding\b",
    r"\bfire\b",
    r"\bi('m| am) dying\b",
    r"\bcall (an ambulance|911|emergency)\b",
    r"\bsomeone broke in\b",
]

_FEAR_KEYWORDS = ["scared", "afraid", "frightened", "terrified", "help me"]


class SafetyAssessment(BaseModel):
    possibleFalseBeliefContext: bool
    fearLevel: str  # "none" | "low" | "moderate" | "high"
    immediateSafetyRisk: bool
    emergencyDetected: bool
    needsReassurance: bool
    validateFear: bool
    confirmUnverifiedClaim: bool
    callerEscalation: bool
    avoidTopics: list[str]


def assess_safety(text: str, matched_emotion_cues: list[str] | None = None) -> SafetyAssessment:
    lowered = text.lower()
    matched_emotion_cues = matched_emotion_cues or []

    emergency_detected = any(re.search(p, lowered) for p in _EMERGENCY_PATTERNS)

    hallucination_match = any(re.search(p, lowered) for p in _POSSIBLE_HALLUCINATION_PATTERNS)
    fear_signal = any(kw in lowered for kw in _FEAR_KEYWORDS) or bool(matched_emotion_cues)

    if emergency_detected:
        return SafetyAssessment(
            possibleFalseBeliefContext=hallucination_match,
            fearLevel="high",
            immediateSafetyRisk=True,
            emergencyDetected=True,
            needsReassurance=True,
            validateFear=True,
            confirmUnverifiedClaim=False,
            callerEscalation=True,
            avoidTopics=["memory_testing", "prolonged_conversation"],
        )

    if hallucination_match:
        fear_level = "high" if fear_signal else "moderate"
        return SafetyAssessment(
            possibleFalseBeliefContext=True,
            fearLevel=fear_level,
            immediateSafetyRisk=False,
            emergencyDetected=False,
            needsReassurance=True,
            validateFear=True,
            confirmUnverifiedClaim=False,
            callerEscalation=fear_level == "high",
            avoidTopics=["direct_confirmation", "confrontational_correction", "ridicule"],
        )

    if fear_signal:
        return SafetyAssessment(
            possibleFalseBeliefContext=False,
            fearLevel="low",
            immediateSafetyRisk=False,
            emergencyDetected=False,
            needsReassurance=True,
            validateFear=True,
            confirmUnverifiedClaim=False,
            callerEscalation=False,
            avoidTopics=[],
        )

    return SafetyAssessment(
        possibleFalseBeliefContext=False,
        fearLevel="none",
        immediateSafetyRisk=False,
        emergencyDetected=False,
        needsReassurance=False,
        validateFear=False,
        confirmUnverifiedClaim=False,
        callerEscalation=False,
        avoidTopics=[],
    )
