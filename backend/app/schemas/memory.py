"""Memory schemas - field names match the caregiver website's Memory
contract exactly. Embeddings are internal-only and never serialized to
frontend responses (spec section 14)."""

from __future__ import annotations

import datetime as dt

from pydantic import BaseModel, Field

from app.models.enums import MemoryCategory, MemorySensitivity


class MemoryCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=150)
    description: str = Field(min_length=1, max_length=2000)
    category: MemoryCategory | str = MemoryCategory.OTHER
    imageUrl: str | None = None
    audioUrl: str | None = None
    sensitivity: MemorySensitivity = MemorySensitivity.LOW
    approved: bool = True
    useForRedirection: bool = True
    aiMayKnowInternally: bool = True
    aiMayMentionDirectly: bool = False
    useForSafetyReasoning: bool = False
    visibleToPatient: bool = False
    visibleToCaregiver: bool = True
    visibleToSelectedFamily: bool = False
    emotionalTone: str | None = None
    associatedPeople: list[str] = Field(default_factory=list)


class MemoryUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    category: MemoryCategory | str | None = None
    imageUrl: str | None = None
    audioUrl: str | None = None
    sensitivity: MemorySensitivity | None = None
    approved: bool | None = None
    useForRedirection: bool | None = None
    aiMayKnowInternally: bool | None = None
    aiMayMentionDirectly: bool | None = None
    useForSafetyReasoning: bool | None = None
    visibleToPatient: bool | None = None
    visibleToCaregiver: bool | None = None
    visibleToSelectedFamily: bool | None = None
    emotionalTone: str | None = None
    associatedPeople: list[str] | None = None


class MemoryResponse(BaseModel):
    id: str
    patientId: str
    title: str
    description: str
    category: str
    imageUrl: str | None = None
    audioUrl: str | None = None
    sensitivity: str
    approved: bool
    useForRedirection: bool
    aiMayKnowInternally: bool
    aiMayMentionDirectly: bool
    useForSafetyReasoning: bool
    visibleToPatient: bool
    visibleToCaregiver: bool
    visibleToSelectedFamily: bool
    emotionalTone: str | None = None
    associatedPeople: list[str] = Field(default_factory=list)
    createdAt: dt.datetime | None = None
    updatedAt: dt.datetime | None = None


class PatientMemoryPublic(BaseModel):
    """Patient-app facing record (spec section 58) - no sensitivity,
    approval, consent, or AI-internal flags."""

    id: str
    title: str
    description: str | None = None
    imageUrl: str | None = None
    audioUrl: str | None = None
    associatedPeople: list[str] = Field(default_factory=list)
    displayDate: str | None = None
