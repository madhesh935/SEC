"""Shared enumerations used across schemas, engines and repositories."""

from enum import StrEnum


class UserRole(StrEnum):
    CAREGIVER = "caregiver"
    FAMILY = "family"
    ADMIN = "admin"


class DementiaStage(StrEnum):
    EARLY = "EARLY"
    MID = "MID"
    LATE = "LATE"


class MemoryCategory(StrEnum):
    """Values match the caregiver website's MemoryCategory type exactly."""

    FAMILY = "FAMILY"
    CAREER = "CAREER"
    TRAVEL = "TRAVEL"
    CHILDHOOD = "CHILDHOOD"
    HOBBY = "HOBBY"
    MUSIC = "MUSIC"
    SPECIAL_EVENT = "SPECIAL_EVENT"
    OTHER = "OTHER"


class MemorySensitivity(StrEnum):
    """Values match the caregiver website's SensitivityLevel type exactly."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class EmotionSignal(StrEnum):
    NEUTRAL = "neutral"
    CALM = "calm"
    HAPPY = "happy"
    SAD = "sad"
    FEAR = "fear"
    ANGER = "anger"
    ANXIOUS = "anxious"
    CONFUSED = "confused"
    GRIEF = "grief"
    AGITATION = "agitation"


class DistressSeverity(StrEnum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    URGENT = "URGENT"


class ResponseStrategy(StrEnum):
    NORMAL_CONVERSATION = "NORMAL_CONVERSATION"
    MEMORY_PROMPT = "MEMORY_PROMPT"
    ROUTINE_REINFORCEMENT = "ROUTINE_REINFORCEMENT"
    REASSURANCE = "REASSURANCE"
    EMOTIONAL_VALIDATION = "EMOTIONAL_VALIDATION"
    GENTLE_REORIENTATION = "GENTLE_REORIENTATION"
    MEMORY_REDIRECTION = "MEMORY_REDIRECTION"
    COMFORT_MODE = "COMFORT_MODE"
    FAMILY_CONNECTION = "FAMILY_CONNECTION"
    CAREGIVER_ESCALATION = "CAREGIVER_ESCALATION"


class UiMode(StrEnum):
    NORMAL = "normal"
    COMFORT = "comfort"
    CAREGIVER_NOTIFIED = "caregiver_notified"


class AlertSeverity(StrEnum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    URGENT = "URGENT"


class AlertStatus(StrEnum):
    """Values match the caregiver website's AlertStatus type exactly."""

    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"


class ConversationChannel(StrEnum):
    VOICE = "voice"
    TEXT = "text"


class SpeechToTextStatus(StrEnum):
    SUCCESS = "success"
    NOT_UNDERSTOOD = "speech_not_understood"
    ERROR = "error"
