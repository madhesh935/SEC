"""Family schemas. Field names (`priority`, `voiceRecordingUrl`) match the
caregiver website's FamilyMember contract; `patientVisible` is an
internal-only flag (not part of the website's typed contract) governing
whether the patient app may see this family member at all."""

from __future__ import annotations

from pydantic import BaseModel, Field


class FamilyCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    relationship: str = Field(min_length=1, max_length=50)
    phone: str | None = None
    priority: int = 1
    photoUrl: str | None = None
    voiceRecordingUrl: str | None = None
    patientVisible: bool = True
    userId: str | None = Field(default=None, description="Linked auth account, if any")


class FamilyUpdateRequest(BaseModel):
    name: str | None = None
    relationship: str | None = None
    phone: str | None = None
    priority: int | None = None
    patientVisible: bool | None = None
    photoUrl: str | None = None
    voiceRecordingUrl: str | None = None


class FamilyMember(BaseModel):
    id: str
    patientId: str
    name: str
    relationship: str | None = None
    photoUrl: str | None = None
    phone: str | None = None
    priority: int = 1
    voiceRecordingUrl: str | None = None
    patientVisible: bool = True
    createdAt: str | None = None


class FamilyMemberPublic(BaseModel):
    """Patient-app facing record - shows a call/message affordance without
    exposing raw contact detail as anything other than the number itself
    (the patient app already treats phone numbers as tap-to-call)."""

    id: str
    name: str
    relationship: str | None = None
    photoUrl: str | None = None
    phoneAvailable: bool = False
    phoneNumber: str | None = None
    voiceMessageAvailable: bool = False
    voiceMessageUrl: str | None = None
    description: str | None = None
