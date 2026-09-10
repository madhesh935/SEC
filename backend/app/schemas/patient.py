"""Patient schemas.

PatientPublic (patient-safe) intentionally omits caregiver-only fields, stage
policy internals and any AI metadata (spec section 58 - patient-facing data
sanitization). PatientAdmin is caregiver/family facing and additionally
carries the extra biography/care fields the caregiver website's UI expects
(gender, emergency contacts, communication/comfort preferences, etc.) beyond
the original spec's minimum field list.

The website's create/update forms use the wire field name `stage`; this is
translated to/from the Firestore/internal field name `configuredStage` in
services/patient_service.py, which every AI engine and test relies on.
"""

from __future__ import annotations

import datetime as dt

from pydantic import BaseModel, Field

from app.models.enums import DementiaStage


class EmergencyContact(BaseModel):
    name: str
    relationship: str
    phone: str
    isPrimary: bool = False


class PatientCreateRequest(BaseModel):
    firstName: str = Field(min_length=1, max_length=100)
    preferredName: str | None = Field(default=None, max_length=100)
    age: int | None = Field(default=None, ge=1, le=130)
    dateOfBirth: dt.date | None = None
    gender: str | None = None
    preferredLanguage: str = Field(default="en")
    stage: DementiaStage = DementiaStage.EARLY
    profilePhotoUrl: str | None = None
    profession: str | None = None
    hometown: str | None = None
    placesLived: list[str] = Field(default_factory=list)
    education: str | None = None
    importantLifeEvents: list[str] = Field(default_factory=list)
    meaningfulPlaces: list[str] = Field(default_factory=list)
    hobbies: list[str] = Field(default_factory=list)
    favouriteTopics: list[str] = Field(default_factory=list)
    favouriteMusic: list[str] = Field(default_factory=list)
    favouriteFood: list[str] = Field(default_factory=list)
    dailyRoutine: str | None = None
    routines: list[str] = Field(default_factory=list)
    communicationPreferences: str | None = None
    comfortPreferences: str | None = None
    emergencyContacts: list[EmergencyContact] = Field(default_factory=list)
    # Initial consent, bundled into the website's patient-creation wizard.
    personalDataConsent: bool = True
    aiConversationConsent: bool = True
    emergencyEscalationConsent: bool = True


class PatientUpdateRequest(BaseModel):
    firstName: str | None = None
    preferredName: str | None = None
    age: int | None = Field(default=None, ge=1, le=130)
    dateOfBirth: dt.date | None = None
    gender: str | None = None
    preferredLanguage: str | None = None
    stage: DementiaStage | None = None
    profilePhotoUrl: str | None = None
    profession: str | None = None
    hometown: str | None = None
    placesLived: list[str] | None = None
    education: str | None = None
    importantLifeEvents: list[str] | None = None
    meaningfulPlaces: list[str] | None = None
    hobbies: list[str] | None = None
    favouriteTopics: list[str] | None = None
    favouriteMusic: list[str] | None = None
    favouriteFood: list[str] | None = None
    dailyRoutine: str | None = None
    routines: list[str] | None = None
    communicationPreferences: str | None = None
    comfortPreferences: str | None = None
    emergencyContacts: list[EmergencyContact] | None = None


class PatientAdmin(BaseModel):
    """Caregiver / family facing patient record."""

    id: str
    firstName: str
    preferredName: str | None = None
    age: int | None = None
    dateOfBirth: dt.date | None = None
    gender: str | None = None
    preferredLanguage: str = "en"
    configuredStage: DementiaStage
    stage: DementiaStage
    profilePhotoUrl: str | None = None
    profession: str | None = None
    hometown: str | None = None
    placesLived: list[str] = Field(default_factory=list)
    education: str | None = None
    importantLifeEvents: list[str] = Field(default_factory=list)
    meaningfulPlaces: list[str] = Field(default_factory=list)
    hobbies: list[str] = Field(default_factory=list)
    favouriteTopics: list[str] = Field(default_factory=list)
    favouriteMusic: list[str] = Field(default_factory=list)
    favouriteFood: list[str] = Field(default_factory=list)
    dailyRoutine: str | None = None
    routines: list[str] = Field(default_factory=list)
    communicationPreferences: str | None = None
    comfortPreferences: str | None = None
    emergencyContacts: list[EmergencyContact] = Field(default_factory=list)
    primaryCaregiverId: str
    archived: bool = False
    createdAt: dt.datetime | None = None
    updatedAt: dt.datetime | None = None
    lastInteraction: str | None = None


class PatientPublic(BaseModel):
    """Patient-app facing record. No caregiver-only or AI-internal fields."""

    id: str
    firstName: str | None = None
    preferredName: str
    preferredLanguage: str = "en"
    profilePhotoUrl: str | None = None


class PatientStatusResponse(BaseModel):
    currentState: str | None = None
    distressScore: int | None = None
    interactionsToday: int | None = None
    repeatedQuestions: int | None = None
    eveningRisk: str | None = None
    lastActiveTimestamp: str | None = None


class PatientLiveStatusResponse(BaseModel):
    isActive: bool
    currentSpeech: str | None = None
    intent: str | None = None
    detectedEmotion: str | None = None
    repetitionCount: int = 0
    distressScore: int = 0
    retrievedMemory: str | None = None
    selectedStrategy: str | None = None
    aiResponse: str | None = None
    safetyStatus: str | None = None
    currentStage: DementiaStage | None = None
    sessionStartedAt: str | None = None
