"""Authentication primitives.

Two distinct identity flows are supported:
  1. Caregiver / family / admin users authenticate with a Firebase ID token
     (verified server-side via the Firebase Admin SDK - the frontend role claim
     is never trusted on its own; the authoritative role lives in Firestore).
  2. Patient devices authenticate with a short-lived JWT issued by this backend
     after a successful pairing-code exchange (see services/pairing_service.py).
"""

from __future__ import annotations

import datetime as dt
import secrets
import string
from dataclasses import dataclass

import jwt
from firebase_admin import auth as firebase_auth

from app.config import get_settings
from app.core.exceptions import AuthenticationError


@dataclass(frozen=True)
class AuthenticatedUser:
    uid: str
    email: str | None
    role: str


@dataclass(frozen=True)
class AuthenticatedDevice:
    patient_id: str
    device_id: str


def verify_firebase_id_token(id_token: str) -> dict:
    try:
        return firebase_auth.verify_id_token(id_token)
    except Exception as exc:  # firebase_admin raises several distinct error types
        raise AuthenticationError("Invalid or expired authentication token.") from exc


# Excludes characters that are easy to confuse when read off a screen and
# typed by hand: 0/O, 1/I. A caregiver reading this code aloud or a patient
# transcribing it should never hit an ambiguous character.
_PAIRING_CODE_ALPHABET = "".join(
    c for c in string.ascii_uppercase + string.digits if c not in "0O1I"
)


def generate_pairing_code(length: int = 8) -> str:
    return "".join(secrets.choice(_PAIRING_CODE_ALPHABET) for _ in range(length))


def generate_pairing_pin(length: int = 4) -> str:
    return "".join(secrets.choice(string.digits) for _ in range(length))


def hash_pairing_code(code: str) -> str:
    import hashlib

    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def issue_patient_tokens(patient_id: str, device_id: str) -> tuple[str, str]:
    settings = get_settings()
    now = dt.datetime.now(dt.UTC)

    access_payload = {
        "sub": device_id,
        "patient_id": patient_id,
        "type": "access",
        "iat": now,
        "exp": now + dt.timedelta(minutes=settings.access_token_ttl_minutes),
    }
    refresh_payload = {
        "sub": device_id,
        "patient_id": patient_id,
        "type": "refresh",
        "iat": now,
        "exp": now + dt.timedelta(days=settings.refresh_token_ttl_days),
    }
    access_token = jwt.encode(access_payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    refresh_token = jwt.encode(
        refresh_payload, settings.jwt_secret, algorithm=settings.jwt_algorithm
    )
    return access_token, refresh_token


def decode_patient_token(token: str, expected_type: str = "access") -> AuthenticatedDevice:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.PyJWTError as exc:
        raise AuthenticationError("Invalid or expired device session.") from exc

    if payload.get("type") != expected_type:
        raise AuthenticationError("Invalid device session token type.")

    patient_id = payload.get("patient_id")
    device_id = payload.get("sub")
    if not patient_id or not device_id:
        raise AuthenticationError("Malformed device session token.")

    return AuthenticatedDevice(patient_id=patient_id, device_id=device_id)
