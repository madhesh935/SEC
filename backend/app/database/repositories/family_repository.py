"""Family member records - used for structured fact retrieval (e.g. "who is my daughter?")."""

from __future__ import annotations

from typing import Any

from app.database.firestore import doc_to_dict, safe_call
from app.database.repositories.base_repository import SubcollectionRepository


class FamilyRepository(SubcollectionRepository):
    collection_name = "family"

    def find_by_name(self, patient_id: str, name: str) -> dict[str, Any] | None:
        query = self._collection(patient_id).where("name", "==", name).limit(1)
        docs = safe_call(query.get)
        for snapshot in docs:
            return doc_to_dict(snapshot)
        return None

    def list_patient_visible(self, patient_id: str) -> list[dict[str, Any]]:
        query = self._collection(patient_id).where("patientVisible", "==", True)
        docs = safe_call(query.get)
        return [d for d in (doc_to_dict(s) for s in docs) if d is not None]
