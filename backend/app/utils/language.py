"""Normalizes a patient's stored language preference to an ISO 639-1 code.

Patient records store this as either a short code ("en") or the full
English name ("English") depending on when/how the record was created -
both speech-to-text (Whisper) and text-to-speech (eSpeak NG) need a plain
short code, so this is the single place that mapping lives.
"""

from __future__ import annotations

_LANGUAGE_CODES = {
    "en": "en",
    "hi": "hi",
    "ta": "ta",
    "es": "es",
    "english": "en",
    "hindi": "hi",
    "tamil": "ta",
    "spanish": "es",
}


def normalize_language_code(value: str | None) -> str:
    if not value:
        return "en"
    return _LANGUAGE_CODES.get(value.strip().lower(), "en")
