from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class ActivityRecommendation(BaseModel):
    id: str
    type: Literal[
        "family_recognition",
        "life_memory_recall",
        "daily_routine_sequencing",
        "photo_recognition",
        "music_memory",
    ]
    title: str
    description: str
    iconName: str | None = None
    estimatedMinutes: int | None = None
    completed: bool = False


class ComfortContentItem(BaseModel):
    id: str
    resourceId: str
    type: Literal["music", "voice", "photo", "audio", "memory"]
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
