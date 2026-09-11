"""Local, free text-to-speech via eSpeak NG.

Runs entirely on this machine - no API key, no billing, and no cloud
round-trip (same rationale as the local Whisper STT in speech/stt.py).
Synthesized audio is written under app/static and served through the
existing /static mount (see app/main.py) rather than Firebase Storage,
which needs credentials this deployment does not have configured.
"""

from __future__ import annotations

import asyncio
import shutil
import subprocess
import tempfile
import time
import uuid
from pathlib import Path

from app.core.exceptions import ExternalServiceError
from app.core.logging import get_logger
from app.utils.language import normalize_language_code

logger = get_logger(__name__)

RESPONSES_DIR = Path(__file__).resolve().parents[2] / "static" / "media" / "responses"
RESPONSE_MAX_AGE_SECONDS = 3600
SYNTHESIS_TIMEOUT_SECONDS = 20

# eSpeak NG voice codes for the languages this app supports (see
# SPEECH_LOCALES in mobile/src/hooks/useCompanionVoice.ts), each using the
# "+f5" variant. Of eSpeak's five female formant profiles (checked directly
# in espeak-ng-data/voices/!v/f1..f5), f5 has both the highest baseline pitch
# (160-228 vs f3's 140-240) and "roughness 0" - the others all add a buzzy
# roughness (3-4) that reads as harsh/mechanical rather than soft.
_VOICE_BY_LANGUAGE = {
    "en": "en-us+f5",
    "hi": "hi+f5",
    "ta": "ta+f5",
    "es": "es+f5",
}
# Words per minute - slower than eSpeak's ~175 default, matching the calmer
# pacing dementia-friendly stage policies ask for (app/ai/stage_engine.py).
_WPM_BY_PACE = {"normal": 160, "slow": 135, "very_slow": 110}
# Pitch (0-99, eSpeak default 50) - a touch higher than default reads softer
# and gentler; pushed further for slower/more soothing paces.
_PITCH_BY_PACE = {"normal": 54, "slow": 58, "very_slow": 60}

# Common install locations checked when the binary isn't on PATH (e.g. a
# process started before eSpeak NG was installed, or a fresh Windows PATH
# that hasn't propagated to this session yet).
_FALLBACK_BINARY_PATHS = [
    r"C:\Program Files\eSpeak NG\espeak-ng.exe",
    r"C:\Program Files (x86)\eSpeak NG\espeak-ng.exe",
    "/usr/bin/espeak-ng",
    "/usr/local/bin/espeak-ng",
]


def _find_binary() -> str | None:
    found = shutil.which("espeak-ng") or shutil.which("espeak")
    if found:
        return found
    for candidate in _FALLBACK_BINARY_PATHS:
        if Path(candidate).exists():
            return candidate
    return None


class TextToSpeechService:
    async def synthesize(self, patient_id: str, text: str, language: str, pace: str) -> str:
        try:
            return await self._synthesize(text, language, pace)
        except ExternalServiceError:
            raise
        except Exception as exc:
            logger.warning("tts_error", error_type=type(exc).__name__, error=str(exc))
            raise ExternalServiceError("Voice playback could not be prepared.") from exc

    async def _synthesize(self, text: str, language: str, pace: str) -> str:
        binary = _find_binary()
        if not binary:
            raise ExternalServiceError("Speech synthesis engine is not installed.")

        RESPONSES_DIR.mkdir(parents=True, exist_ok=True)
        _sweep_old_responses(RESPONSES_DIR)

        voice = _VOICE_BY_LANGUAGE.get(normalize_language_code(language), "en-us+f5")
        wpm = _WPM_BY_PACE.get(pace, 135)
        pitch = _PITCH_BY_PACE.get(pace, 58)
        filename = f"{uuid.uuid4().hex}.wav"
        out_path = RESPONSES_DIR / filename

        # eSpeak NG mis-decodes non-Latin scripts (Tamil, Hindi, ...) when
        # text is passed as a raw argv argument - the OS command-line
        # encoding silently corrupts it into near-silent output. Writing it
        # to a UTF-8 file and using `-f` avoids that entirely.
        with tempfile.NamedTemporaryFile(
            mode="w", suffix=".txt", encoding="utf-8", delete=False
        ) as handle:
            handle.write(text)
            text_path = Path(handle.name)

        try:
            await asyncio.to_thread(
                self._run_espeak_sync, binary, voice, wpm, pitch, text_path, out_path
            )
        finally:
            text_path.unlink(missing_ok=True)

        return f"/static/media/responses/{filename}"

    @staticmethod
    def _run_espeak_sync(
        binary: str, voice: str, wpm: int, pitch: int, text_path: Path, out_path: Path
    ) -> None:
        # A blocking subprocess call run via asyncio.to_thread rather than
        # asyncio.create_subprocess_exec - the same pattern app/ai/speech/stt.py
        # uses for Whisper. Windows only supports asyncio subprocess creation
        # on ProactorEventLoop; uvicorn switches to SelectorEventLoop whenever
        # it runs as a subprocess of its own reloader (--reload), which makes
        # create_subprocess_exec raise a bare, message-less NotImplementedError.
        # subprocess.run has no such event-loop dependency.
        try:
            result = subprocess.run(
                [
                    binary,
                    "-v",
                    voice,
                    "-s",
                    str(wpm),
                    "-p",
                    str(pitch),
                    "-f",
                    str(text_path),
                    "-w",
                    str(out_path),
                ],
                capture_output=True,
                timeout=SYNTHESIS_TIMEOUT_SECONDS,
            )
        except subprocess.TimeoutExpired:
            raise ExternalServiceError("Speech synthesis timed out.")

        if result.returncode != 0 or not out_path.exists():
            raise ExternalServiceError(
                f"espeak-ng exited with {result.returncode}: "
                f"{result.stderr.decode(errors='ignore').strip()}"
            )


def _sweep_old_responses(directory: Path) -> None:
    cutoff = time.time() - RESPONSE_MAX_AGE_SECONDS
    for path in directory.glob("*.wav"):
        try:
            if path.stat().st_mtime < cutoff:
                path.unlink(missing_ok=True)
        except OSError:
            pass
