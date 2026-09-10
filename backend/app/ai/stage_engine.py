"""Stage-adaptive interaction policy.

The dementia stage is a caregiver/clinician-configured field on the patient
record (spec section 8) - this engine NEVER infers or diagnoses a stage. It
only translates the already-configured stage into a structured interaction
policy consumed by the strategy engine and prompt builder.
"""

from __future__ import annotations

from pydantic import BaseModel

from app.models.enums import DementiaStage


class StagePolicy(BaseModel):
    maxSentences: int
    languageComplexity: str
    pace: str
    allowMemoryPrompt: bool
    avoidMemoryTesting: bool
    repetitionTolerance: str
    earlierEscalation: bool


_POLICIES: dict[DementiaStage, StagePolicy] = {
    DementiaStage.EARLY: StagePolicy(
        maxSentences=4,
        languageComplexity="moderate",
        pace="normal",
        allowMemoryPrompt=True,
        avoidMemoryTesting=False,
        repetitionTolerance="normal",
        earlierEscalation=False,
    ),
    DementiaStage.MID: StagePolicy(
        maxSentences=2,
        languageComplexity="simple",
        pace="slow",
        allowMemoryPrompt=True,
        avoidMemoryTesting=True,
        repetitionTolerance="high",
        earlierEscalation=False,
    ),
    DementiaStage.LATE: StagePolicy(
        maxSentences=1,
        languageComplexity="very_simple",
        pace="very_slow",
        allowMemoryPrompt=False,
        avoidMemoryTesting=True,
        repetitionTolerance="very_high",
        earlierEscalation=True,
    ),
}


def get_stage_policy(stage: DementiaStage) -> StagePolicy:
    return _POLICIES[stage]
