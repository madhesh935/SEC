"""Local, free speech-to-text via faster-whisper.

Runs entirely on this machine - no API key, no per-request cost, and raw
patient audio never leaves the server (spec section 22). The model is
loaded exactly once, lazily on first use, and reused across requests -
never reloaded per-request (same pattern as app/ai/embeddings.py).
"""

from __future__ import annotations

import asyncio
from io import BytesIO
from typing import TYPE_CHECKING, Any

from app.config import get_settings
from app.core.exceptions import SpeechRecognitionError
from app.core.logging import get_logger

if TYPE_CHECKING:
    from faster_whisper import WhisperModel

logger = get_logger(__name__)


class SpeechToTextService:
    # Class-level so the (large, slow-to-load) model is shared by every
    # request instead of being reloaded per SpeechToTextService() instance.
    _model: Any | None = None

    def __init__(self) -> None:
        self._settings = get_settings()

    def _load(self) -> WhisperModel:
        if SpeechToTextService._model is not None:
            return SpeechToTextService._model

        # Imported lazily so importing this module never forces a
        # faster-whisper/ctranslate2 install for code paths - like the unit
        # test suite - that never actually transcribe audio.
        from faster_whisper import WhisperModel

        model_size = self._settings.whisper_model
        logger.info("whisper_model_loading", model=model_size)
        SpeechToTextService._model = WhisperModel(model_size, device="cpu", compute_type="int8")
        logger.info("whisper_model_loaded", model=model_size)
        return SpeechToTextService._model

    async def transcribe(self, audio_bytes: bytes, filename: str, content_type: str) -> str | None:
        """Returns the transcript, or None if speech could not be understood.
        Never fabricates a transcript on failure (spec section 73)."""
        try:
            return await asyncio.to_thread(self._transcribe_sync, audio_bytes)
        except SpeechRecognitionError:
            raise
        except Exception as exc:
            logger.warning("stt_error", error=str(exc))
            raise SpeechRecognitionError("Speech recognition service returned an error.") from exc

    def _transcribe_sync(self, audio_bytes: bytes) -> str | None:
        model = self._load()
        segments, _info = model.transcribe(BytesIO(audio_bytes), beam_size=1, vad_filter=True)
        transcript = "".join(segment.text for segment in segments).strip()
        return transcript or None
