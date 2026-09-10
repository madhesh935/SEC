"""Secure patient device pairing (spec section 11), plus a short 4-digit PIN
alternative used by the patient app's "quick setup" option. Both are stored
hashed, one-time use, and expire after a configurable TTL."""

from __future__ import annotations

import datetime as dt

from app.config import get_settings
from app.core.audit import audit_log
from app.core.exceptions import PairingError
from app.core.security import (
    generate_pairing_code,
    generate_pairing_pin,
    hash_pairing_code,
    issue_patient_tokens,
)
from app.database.repositories.device_repository import (
    PairingPinRepository,
    PairingRepository,
    PatientDeviceRepository,
)
from app.database.repositories.patient_repository import PatientRepository

_MAX_PIN_GENERATION_ATTEMPTS = 10


class PairingService:
    def __init__(
        self,
        pairing_repository: PairingRepository | None = None,
        pairing_pin_repository: PairingPinRepository | None = None,
        patient_device_repository: PatientDeviceRepository | None = None,
        patient_repository: PatientRepository | None = None,
    ) -> None:
        self.pairing_repository = pairing_repository or PairingRepository()
        self.pairing_pin_repository = pairing_pin_repository or PairingPinRepository()
        self.patient_device_repository = patient_device_repository or PatientDeviceRepository()
        self.patient_repository = patient_repository or PatientRepository()

    def _get_active_patient(self, patient_id: str) -> dict:
        patient = self.patient_repository.get(patient_id)
        if not patient or patient.get("archived"):
            raise PairingError("Patient profile was not found.")
        return patient

    def create_pairing_code(self, actor_uid: str, patient_id: str) -> dict:
        self._get_active_patient(patient_id)
        settings = get_settings()
        expires_at = dt.datetime.now(dt.UTC) + dt.timedelta(
            seconds=settings.pairing_code_ttl_seconds
        )
        for _ in range(_MAX_PIN_GENERATION_ATTEMPTS):
            code = generate_pairing_code()
            if self.pairing_repository.create(patient_id, hash_pairing_code(code), expires_at):
                audit_log("pairing_code_created", actor_uid, patient_id=patient_id)
                return {"pairing_code": code, "expires_at": expires_at.isoformat()}
        raise PairingError("Unable to generate a pairing code right now. Please try again.")

    def create_pairing_pin(self, actor_uid: str, patient_id: str) -> dict:
        self._get_active_patient(patient_id)
        settings = get_settings()
        expires_at = dt.datetime.now(dt.UTC) + dt.timedelta(
            seconds=settings.pairing_pin_ttl_seconds
        )

        for _ in range(_MAX_PIN_GENERATION_ATTEMPTS):
            pin = generate_pairing_pin()
            pin_hash = hash_pairing_code(pin)
            if self.pairing_pin_repository.create(patient_id, pin_hash, expires_at):
                audit_log("pairing_pin_created", actor_uid, patient_id=patient_id)
                return {"pin": pin, "expires_at": expires_at.isoformat()}

        raise PairingError("Unable to generate a unique PIN right now. Please try again.")

    def verify_pairing(self, pairing_code: str, device_id: str) -> dict:
        record = self.pairing_repository.consume(hash_pairing_code(pairing_code))
        if record is None:
            raise PairingError("Pairing code is invalid, expired, or already used.")
        return self._bind_and_issue(record["patientId"], device_id)

    def verify_pin(self, pin: str, device_id: str) -> dict:
        record = self.pairing_pin_repository.consume(hash_pairing_code(pin))
        if record is None:
            raise PairingError("PIN is invalid, expired, or already used.")
        return self._bind_and_issue(record["patientId"], device_id)

    def _bind_and_issue(self, patient_id: str, device_id: str) -> dict:
        patient = self._get_active_patient(patient_id)
        self.patient_device_repository.bind(patient_id, device_id)
        access_token, refresh_token = issue_patient_tokens(patient_id, device_id)
        audit_log("device_paired", device_id, patient_id=patient_id)

        return {
            "accessToken": access_token,
            "refreshToken": refresh_token,
            "patientId": patient_id,
            "patientPreferredName": patient.get("preferredName") if patient else None,
        }
