"""Read-only Firebase/media preflight plus a short non-personal TTS capability request.

Run from backend with its configured environment. Prints capability results only,
never credentials, patient records, generated audio, or signed URLs. No data is stored.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from google.auth.transport.requests import AuthorizedSession

from app.database.firebase import get_storage_bucket, initialize_firebase
from app.database.firestore import db
from app.database.storage import signed_url


def main():
    result = {}
    credential = initialize_firebase().credential.get_credential()
    result["private_media_signing"] = hasattr(credential, "sign_bytes")
    try:
        db().collection("patients").limit(1).get(timeout=15, retry=None)
        result["firestore_read"] = True
    except Exception as exc:
        result["firestore_read"] = type(exc).__name__
    try:
        get_storage_bucket().reload(timeout=15)
        result["storage_bucket"] = True
    except Exception as exc:
        result["storage_bucket"] = type(exc).__name__
    try:
        # Signing a nonexistent probe path does not read, create, or expose patient media.
        signed_url("runtime-check/no-content")
        result["signed_url_generation"] = True
    except Exception as exc:
        result["signed_url_generation"] = type(exc).__name__
    try:
        with AuthorizedSession(credential) as session:
            response = session.post(
                "https://texttospeech.googleapis.com/v1/text:synthesize",
                json={
                    "input": {"text": "A quiet moment."},
                    "voice": {"languageCode": "en-US"},
                    "audioConfig": {"audioEncoding": "MP3"},
                },
                timeout=20,
            )
        result["tts_http_status"] = response.status_code
        result["tts_audio_returned"] = bool(response.ok and response.json().get("audioContent"))
        if not response.ok:
            result["tts_error_code"] = response.json().get("error", {}).get("status")
    except Exception as exc:
        result["tts_request"] = type(exc).__name__
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
