"""Audio upload validation for voice conversation and media endpoints."""

from __future__ import annotations

from app.core.exceptions import ValidationError

ALLOWED_AUDIO_CONTENT_TYPES = {
    "audio/mpeg",
    "audio/mp4",
    "audio/wav",
    "audio/x-wav",
    "audio/webm",
    "audio/m4a",
    "audio/aac",
    "audio/ogg",
}

MAX_VOICE_UPLOAD_BYTES = 15 * 1024 * 1024


def validate_voice_upload(content_type: str | None, size: int) -> None:
    if not content_type or content_type.lower() not in ALLOWED_AUDIO_CONTENT_TYPES:
        raise ValidationError("Unsupported audio format.")
    if size <= 0:
        raise ValidationError("Audio file is empty.")
    if size > MAX_VOICE_UPLOAD_BYTES:
        raise ValidationError("Audio file exceeds the maximum allowed duration/size.")


def extension_for_content_type(content_type: str) -> str:
    mapping = {
        "audio/mpeg": "mp3",
        "audio/mp4": "m4a",
        "audio/wav": "wav",
        "audio/x-wav": "wav",
        "audio/webm": "webm",
        "audio/m4a": "m4a",
        "audio/aac": "aac",
        "audio/ogg": "ogg",
    }
    return mapping.get(content_type.lower(), "bin")
