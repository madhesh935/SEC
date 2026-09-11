"""Conversation API schemas. These are the patient-safe response contracts -
no internal safety/strategy/distress metadata is included (spec section 58)."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.patient_experience import ContextMedia, PatientAction


class TextConversationRequest(BaseModel):
    patientId: str
    conversationId: str | None = None
    text: str = Field(min_length=1, max_length=2000)


class ConversationResponse(BaseModel):
    actions: list[PatientAction] = Field(default_factory=list)
    conversationId: str
    transcript: str
    responseText: str
    responseAudioUrl: str | None = None
    status: Literal["success", "ai_disabled", "speech_not_understood", "tts_unavailable"]
    uiMode: Literal["normal", "comfort", "caregiver_notified"]
    contextMedia: ContextMedia | None = None


class HelpRequestPayload(BaseModel):
    reason: str | None = None


class RequestHelpResponse(BaseModel):
    success: bool
    message: str | None = None
    timestamp: str | None = None


class HelpContacts(BaseModel):
    caregiverName: str | None = None
    caregiverPhone: str | None = None
    caregiverAvailable: bool | None = None
    emergencyPhone: str | None = None
    familyContactPhone: str | None = None
    familyContactName: str | None = None


class ConversationEvent(BaseModel):
    """Caregiver-website-facing event record - matches its ConversationEvent
    contract. Deliberately excludes raw internal reasoning/system prompts
    (spec section 58/60), surfacing only operational fields."""

    id: str
    patientId: str
    transcript: str | None = None
    intent: str | None = None
    emotion: str | None = None
    repetitionCount: int | None = None
    distressScore: int | None = None
    strategy: list[str] = Field(default_factory=list)
    createdAt: str
    aiResponse: str | None = None
    safetyStatus: str | None = None
    retrievedMemory: str | None = None
