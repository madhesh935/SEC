"""Pairing codes and caregiver push-notification device tokens."""

from __future__ import annotations

import datetime as dt
from typing import Any

from app.database.firebase import server_timestamp
from app.database.firestore import db, doc_to_dict, patient_doc, safe_call


class PairingRepository:
    """Pairing codes are stored hashed, top-level, with a TTL and one-time use."""

    def _collection(self):
        return db().collection("pairing_codes")

    def create(self, patient_id: str, code_hash: str, expires_at: dt.datetime) -> None:
        safe_call(
            self._collection().document(code_hash).set,
            {
                "patientId": patient_id,
                "expiresAt": expires_at,
                "used": False,
                "createdAt": server_timestamp(),
            },
        )

    def consume(self, code_hash: str) -> dict[str, Any] | None:
        ref = self._collection().document(code_hash)
        snapshot = safe_call(ref.get)
        data = doc_to_dict(snapshot)
        if data is None or data.get("used"):
            return None
        expires_at = data.get("expiresAt")
        if expires_at is not None:
            now = dt.datetime.now(dt.timezone.utc)
            if hasattr(expires_at, "timestamp") and expires_at.timestamp() < now.timestamp():
                return None
        safe_call(ref.update, {"used": True})
        return data


class PairingPinRepository:
    """Short 4-digit PIN pairing (spec-adjacent, added for the patient app's
    'quick setup with preset care PIN' option). Kept in its own top-level
    collection, separate from the long random pairing codes, because a
    4-digit keyspace (10,000 values) collides often enough that the service
    layer must check-before-create rather than blindly overwrite."""

    def _collection(self):
        return db().collection("pairing_pins")

    def get_active(self, pin_hash: str) -> dict[str, Any] | None:
        snapshot = safe_call(self._collection().document(pin_hash).get)
        data = doc_to_dict(snapshot)
        if data is None or data.get("used"):
            return None
        expires_at = data.get("expiresAt")
        if expires_at is not None:
            now = dt.datetime.now(dt.timezone.utc)
            if hasattr(expires_at, "timestamp") and expires_at.timestamp() < now.timestamp():
                return None
        return data

    def create(self, patient_id: str, pin_hash: str, expires_at: dt.datetime) -> None:
        safe_call(
            self._collection().document(pin_hash).set,
            {
                "patientId": patient_id,
                "expiresAt": expires_at,
                "used": False,
                "createdAt": server_timestamp(),
            },
        )

    def consume(self, pin_hash: str) -> dict[str, Any] | None:
        record = self.get_active(pin_hash)
        if record is None:
            return None
        safe_call(self._collection().document(pin_hash).update, {"used": True})
        return record


class CaregiverDeviceTokenRepository:
    """FCM device tokens for caregiver/family push notifications."""

    def _collection(self, user_id: str):
        return db().collection("users").document(user_id).collection("fcm_tokens")

    def register(self, user_id: str, token: str) -> None:
        safe_call(
            self._collection(user_id).document(token).set,
            {"token": token, "registeredAt": server_timestamp()},
        )

    def list_tokens(self, user_id: str) -> list[str]:
        docs = safe_call(self._collection(user_id).get)
        return [d.id for d in docs]


class PatientDeviceRepository:
    def bind(self, patient_id: str, device_id: str) -> None:
        safe_call(
            patient_doc(patient_id).collection("devices").document(device_id).set,
            {"deviceId": device_id, "boundAt": server_timestamp(), "active": True},
        )

    def is_bound(self, patient_id: str, device_id: str) -> bool:
        snapshot = safe_call(
            patient_doc(patient_id).collection("devices").document(device_id).get
        )
        data = doc_to_dict(snapshot)
        return bool(data and data.get("active"))
