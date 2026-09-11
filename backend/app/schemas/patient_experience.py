from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class PatientSettings(BaseModel):
    textSize: Literal["normal", "large", "extra-large"] = "large"
    reducedMotion: bool = False
    voiceVolume: float = Field(default=0.9, ge=0, le=1)
    replayVoiceResponse: bool = True


class PatientAction(BaseModel):
    type: Literal[
        "PLAY_FAMILY_VOICE",
        "SHOW_MEMORY",
        "PLAY_COMFORT_AUDIO",
        "CALL_CAREGIVER",
        "OPEN_FAMILY",
        "OPEN_COMFORT",
    ]
    label: str
    resourceId: str | None = None
    imageUrl: str | None = None
    audioUrl: str | None = None


class ContextMedia(BaseModel):
    type: Literal["family", "memory", "comfort", "music"]
    title: str
    subtitle: str | None = None
    imageUrl: str | None = None
    audioUrl: str | None = None
    audioLabel: str | None = None
    actionType: str | None = None
    resourceId: str | None = None


class HomeRecommendation(BaseModel):
    title: str
    subtitle: str | None = None
    imageUrl: str | None = None
    audioUrl: str | None = None
    action: PatientAction


class ActivityOption(BaseModel):
    id: str
    label: str


class ActivityDetail(BaseModel):
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
    prompt: str
    difficulty: Literal["gentle", "supported"]
    interactionMode: Literal["choice", "sequence", "reflection", "listen"]
    imageUrl: str | None = None
    audioUrl: str | None = None
    nextActivityId: str | None = None
    options: list[ActivityOption] = Field(default_factory=list)
    steps: list[ActivityOption] = Field(default_factory=list)


class ActivitySubmission(BaseModel):
    result: Literal["completed", "skipped", "liked"]
    response: list[str] = Field(default_factory=list, max_length=30)
    completionTime: float = Field(ge=0, le=86400)


class ActivityFeedback(BaseModel):
    activityId: str
    patientId: str
    result: str
    response: list[str]
    completionTime: float
    timestamp: str
    feedback: str
