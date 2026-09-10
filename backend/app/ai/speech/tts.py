"""Server speech synthesis using project credentials and private Storage."""

from __future__ import annotations

import asyncio
import base64

from google.auth.transport.requests import AuthorizedSession

from app.core.exceptions import ExternalServiceError
from app.database.firebase import initialize_firebase
from app.database.storage import build_storage_path, signed_url, upload_bytes


class TextToSpeechService:
    async def synthesize(self, patient_id: str, text: str, language: str, pace: str) -> str:
        try:
            return await asyncio.to_thread(self._synthesize, patient_id, text, language, pace)
        except Exception as exc:
            raise ExternalServiceError("Voice playback could not be prepared.") from exc

    def _synthesize(self, patient_id, text, language, pace):
        credential = initialize_firebase().credential.get_credential()
        language = {
            "English": "en-US",
            "Hindi": "hi-IN",
            "Tamil": "ta-IN",
            "Spanish": "es-ES",
            "en": "en-US",
            "hi": "hi-IN",
            "ta": "ta-IN",
            "es": "es-ES",
        }.get(language, language)
        with AuthorizedSession(credential) as session:
            response = session.post(
                "https://texttospeech.googleapis.com/v1/text:synthesize",
                json={
                    "input": {"text": text},
                    "voice": {"languageCode": language},
                    "audioConfig": {
                        "audioEncoding": "MP3",
                        "speakingRate": {"normal": 0.95, "slow": 0.85, "very_slow": 0.75}.get(
                            pace, 0.85
                        ),
                    },
                },
                timeout=25,
            )
            response.raise_for_status()
            audio = base64.b64decode(response.json()["audioContent"], validate=True)
        if not audio:
            raise ValueError("Empty speech audio")
        path = build_storage_path(patient_id, "responses", "mp3")
        upload_bytes(path, audio, "audio/mpeg")
        return signed_url(path, expires_minutes=60)
