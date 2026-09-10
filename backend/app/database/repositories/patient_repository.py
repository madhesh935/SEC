"""Top-level patient document repository."""

from __future__ import annotations

from typing import Any

from app.database.firebase import server_timestamp
from app.database.firestore import doc_to_dict, patient_doc, patients_collection, safe_call


class PatientRepository:
    def get(self, patient_id: str) -> dict[str, Any] | None:
        snapshot = safe_call(patient_doc(patient_id).get)
        return doc_to_dict(snapshot)

    def list_for_caregiver(self, caregiver_id: str, limit: int = 50) -> list[dict[str, Any]]:
        query = (
            patients_collection()
            .where("primaryCaregiverId", "==", caregiver_id)
            .where("archived", "==", False)
            .limit(limit)
        )
        docs = safe_call(query.get)
        return [d for d in (doc_to_dict(s) for s in docs) if d is not None]

    def create(self, data: dict[str, Any]) -> dict[str, Any]:
        payload = {
            **data,
            "archived": False,
            "createdAt": server_timestamp(),
            "updatedAt": server_timestamp(),
        }
        ref = patients_collection().document()
        safe_call(ref.set, payload)
        return {**data, "id": ref.id, "archived": False}

    def update(self, patient_id: str, data: dict[str, Any]) -> None:
        payload = {**data, "updatedAt": server_timestamp()}
        safe_call(patient_doc(patient_id).update, payload)

    def archive(self, patient_id: str) -> None:
        safe_call(
            patient_doc(patient_id).update,
            {"archived": True, "updatedAt": server_timestamp()},
        )
