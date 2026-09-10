"""Custom exception hierarchy mapped to HTTP responses in main.py."""

from __future__ import annotations


class GeriCareError(Exception):
    """Base class for all application-raised errors."""

    code: str = "INTERNAL_ERROR"
    status_code: int = 500

    def __init__(self, message: str, code: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        if code:
            self.code = code


class AuthenticationError(GeriCareError):
    code = "AUTHENTICATION_ERROR"
    status_code = 401


class AuthorizationError(GeriCareError):
    code = "AUTHORIZATION_ERROR"
    status_code = 403


class PatientNotFoundError(GeriCareError):
    code = "PATIENT_NOT_FOUND"
    status_code = 404


class ResourceNotFoundError(GeriCareError):
    code = "RESOURCE_NOT_FOUND"
    status_code = 404


class ConsentViolationError(GeriCareError):
    code = "CONSENT_VIOLATION"
    status_code = 403


class ExternalServiceError(GeriCareError):
    code = "EXTERNAL_SERVICE_ERROR"
    status_code = 502


class SpeechRecognitionError(GeriCareError):
    code = "SPEECH_RECOGNITION_ERROR"
    status_code = 422


class SpeechSynthesisError(GeriCareError):
    code = "SPEECH_SYNTHESIS_ERROR"
    status_code = 502


class LLMServiceError(GeriCareError):
    code = "LLM_SERVICE_ERROR"
    status_code = 502


class ValidationError(GeriCareError):
    code = "VALIDATION_ERROR"
    status_code = 422


class RateLimitError(GeriCareError):
    code = "RATE_LIMIT_EXCEEDED"
    status_code = 429


class DatabaseUnavailableError(GeriCareError):
    code = "DATABASE_UNAVAILABLE"
    status_code = 503


class PairingError(GeriCareError):
    code = "PAIRING_ERROR"
    status_code = 400


class ConflictError(GeriCareError):
    code = "CONFLICT"
    status_code = 409
