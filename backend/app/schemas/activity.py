from __future__ import annotations

from pydantic import BaseModel, Field


class ActivityRecommendation(BaseModel):
    id: str
    type: str
    title: str
    description: str
    iconName: str | None = None
    estimatedMinutes: int | None = None
    completed: bool = False


class ActivityResultRequest(BaseModel):
    outcome: str = Field(description="e.g. completed, skipped, distressed")
    notes: str | None = None


class ComfortContentItem(BaseModel):
    id: str
    type: str  # one of: music | voice | photo | audio | memory
    title: str
    mediaUrl: str | None = None
    imageUrl: str | None = None
    durationSeconds: int | None = None
    description: str | None = None


class FamilyPromptItem(BaseModel):
    id: str
    topic: str
    description: str
    recommendedTone: str | None = None
    suggestedBy: str | None = None
