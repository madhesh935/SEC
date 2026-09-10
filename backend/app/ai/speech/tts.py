"""ElevenLabs Text-to-Speech integration.

Prefers a calm, slower, consistent patient-facing voice (spec section 23).
Generated audio is uploaded to Firebase Storage with a short-lived signed URL
rather than being exposed publicly and indefinitely.
"""

from __future__ import annotations

import httpx

from app.config import get_settings
from app.core.exceptions import SpeechSynthesisError
from app.core.logging import get_logger
from app.database.storage import build_storage_path, signed_url, upload_bytes

logger = get_logger(__name__)

_TIMEOUT = httpx.Timeout(connect=5.0, read=30.0, write=10.0, pool=5.0)


class TextToSpeechService:
    def __init__(self) -> None:
        self._settings = get_settings()

    async def synthesize(self, text: str, patient_id: str) -> str | None:
        """Returns a temporary signed URL to the synthesized audio, or None if
        TTS is unavailable (the caller should still return the text response)."""
        if not self._settings.elevenlabs_api_key or not self._settings.elevenlabs_voice_id:
            logger.warning("tts_not_configured")
            return None

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{self._settings.elevenlabs_voice_id}"
        headers = {
            "xi-api-key": self._settings.elevenlabs_api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }
        payload = {
            "text": text,
            "model_id": self._settings.elevenlabs_tts_model,
            "voice_settings": {
                "stability": 0.75,
                "similarity_boost": 0.75,
                "speed": 0.9,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                response = await client.post(url, headers=headers, json=payload)
        except httpx.TimeoutException as exc:
            raise SpeechSynthesisError("Speech synthesis timed out.") from exc
        except httpx.HTTPError as exc:
            raise SpeechSynthesisError("Speech synthesis service is unreachable.") from exc

        if response.status_code >= 400:
            logger.warning("tts_error_response", status=response.status_code)
            raise SpeechSynthesisError("Speech synthesis service returned an error.")

        storage_path = build_storage_path(patient_id, "comfort_audio", "mp3")
        upload_bytes(storage_path, response.content, "audio/mpeg")
        return signed_url(storage_path, expires_minutes=120)
