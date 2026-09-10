"""ElevenLabs Speech-to-Text integration.

The ElevenLabs API key is only ever used server-side - the patient app sends
raw audio to this backend, never directly to ElevenLabs (spec section 22).
"""

from __future__ import annotations

import httpx

from app.config import get_settings
from app.core.exceptions import SpeechRecognitionError
from app.core.logging import get_logger

logger = get_logger(__name__)

_TIMEOUT = httpx.Timeout(connect=5.0, read=30.0, write=30.0, pool=5.0)
_STT_URL = "https://api.elevenlabs.io/v1/speech-to-text"


class SpeechToTextService:
    def __init__(self) -> None:
        self._settings = get_settings()

    async def transcribe(self, audio_bytes: bytes, filename: str, content_type: str) -> str | None:
        """Returns the transcript, or None if speech could not be understood.
        Never fabricates a transcript on failure (spec section 73)."""
        if not self._settings.elevenlabs_api_key:
            raise SpeechRecognitionError("Speech recognition service is not configured.")

        headers = {"xi-api-key": self._settings.elevenlabs_api_key}
        files = {"file": (filename, audio_bytes, content_type)}
        data = {"model_id": self._settings.elevenlabs_stt_model}

        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                response = await client.post(_STT_URL, headers=headers, files=files, data=data)
        except httpx.TimeoutException as exc:
            raise SpeechRecognitionError("Speech recognition timed out.") from exc
        except httpx.HTTPError as exc:
            raise SpeechRecognitionError("Speech recognition service is unreachable.") from exc

        if response.status_code == 422:
            return None
        if response.status_code >= 400:
            logger.warning("stt_error_response", status=response.status_code)
            raise SpeechRecognitionError("Speech recognition service returned an error.")

        payload = response.json()
        transcript = payload.get("text", "").strip()
        return transcript or None
