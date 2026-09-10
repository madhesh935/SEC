"""Consent API schema - matches the caregiver website's ConsentSettings
contract exactly. See services/consent_service.py for the translation to/
from the internal canonical fields the orchestrator actually enforces."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class ConsentSettings(BaseModel):
    biographyUsage: bool = True
    aiMayMentionMemoryDirectly: bool = False
    patientMaySeeMemory: bool = True
    patientId: str
    personalDataCollection: bool = True
    memoriesUsage: bool = True
    photosUsage: bool = True
    voiceRecordingsUsage: bool = False
    aiConversationUsage: bool = True
    caregiverAccessLevel: Literal["FULL", "RESTRICTED"] = "FULL"
    familyAccessLevel: Literal["APPROVED_ONLY", "NONE", "CUSTOM"] = "APPROVED_ONLY"
    emergencyEscalationEnabled: bool = True
    dataRetentionDays: int = 365
    updatedAt: str | None = None


class ConsentUpdateRequest(BaseModel):
    biographyUsage: bool | None = None
    aiMayMentionMemoryDirectly: bool | None = None
    patientMaySeeMemory: bool | None = None
    personalDataCollection: bool | None = None
    memoriesUsage: bool | None = None
    photosUsage: bool | None = None
    voiceRecordingsUsage: bool | None = None
    aiConversationUsage: bool | None = None
    caregiverAccessLevel: Literal["FULL", "RESTRICTED"] | None = None
    familyAccessLevel: Literal["APPROVED_ONLY", "NONE", "CUSTOM"] | None = None
    emergencyEscalationEnabled: bool | None = None
    dataRetentionDays: int | None = None
