from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

Permission = Literal[
    "viewProfile", "viewMemories", "contributeMemory", "uploadPhoto", "uploadVoice", "viewUpdates"
]
ActivityKind = Literal[
    "family_recognition",
    "life_memory_recall",
    "daily_routine_sequencing",
    "photo_recognition",
    "music_memory",
]


class InvitationRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    relationship: str = Field(min_length=1, max_length=60)
    permissions: list[Permission] = Field(default_factory=lambda: ["viewProfile", "viewMemories"])


class InvitationResponse(BaseModel):
    token: str
    expiresAt: str
    email: str


class SessionExchange(BaseModel):
    idToken: str
    invitationToken: str | None = Field(default=None, min_length=32, max_length=128)


class AccessGrant(BaseModel):
    userId: str
    patientId: str
    relationship: str
    permissions: list[Permission]
    status: Literal["active", "revoked"]
    email: str | None = None


class AccessUpdate(BaseModel):
    permissions: list[Permission]
    status: Literal["active", "revoked"] = "active"


class FamilyPatient(BaseModel):
    id: str
    preferredName: str
    relationship: str
    profilePhotoUrl: str | None = None
    preferredLanguage: str | None = None
    profession: str | None = None
    hometown: str | None = None
    hobbies: list[str] = Field(default_factory=list)
    favouriteTopics: list[str] = Field(default_factory=list)
    caregiverName: str | None = None
    caregiverEmail: str | None = None
    permissions: list[Permission]


class FamilyMemory(BaseModel):
    id: str
    title: str
    description: str
    category: str
    imageUrl: str | None = None
    audioUrl: str | None = None
    displayDate: str | None = None
    reviewStatus: Literal["approved", "pending"]
    contributedByYou: bool


class FamilyContribution(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=1, max_length=150)
    description: str = Field(min_length=1, max_length=2000)
    category: Literal["FAMILY", "MUSIC", "RELAXING_SOUND", "OTHER"] = "FAMILY"
    imageUrl: str | None = None
    audioUrl: str | None = None


class ConnectionSuggestion(BaseModel):
    id: str
    title: str
    description: str
    memoryId: str


class FamilyNotification(BaseModel):
    id: str
    title: str
    message: str
    createdAt: str | None = None


class UserPreferences(BaseModel):
    notificationsEnabled: bool = True
    language: str = Field(default="en", min_length=2, max_length=30)


class UserProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class DeviceRecord(BaseModel):
    deviceId: str
    active: bool
    connected: bool
    boundAt: str | None = None
    lastSeenAt: str | None = None


class ActivityConfiguration(BaseModel):
    type: ActivityKind
    enabled: bool


class ManagedActivity(ActivityConfiguration):
    title: str
    availableCount: int
    completionCount: int
    lastPlayed: str | None = None


class DashboardSummary(BaseModel):
    currentState: str | None
    conversationsToday: int
    repeatedTopics: int
    activeAlerts: int
    connected: bool
    lastActive: str | None = None
    biographySummary: str | None = None


class UnifiedActivityEvent(BaseModel):
    id: str
    type: Literal["conversation", "activity", "alert", "memory", "comfort"]
    title: str
    description: str | None = None
    timestamp: str | None = None
    severity: str | None = None
    icon: str | None = None
