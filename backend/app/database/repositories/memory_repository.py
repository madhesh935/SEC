"""Personal memory records, including embeddings used for semantic retrieval."""

from __future__ import annotations

from typing import Any

from app.database.firestore import doc_to_dict, safe_call
from app.database.repositories.base_repository import SubcollectionRepository


class MemoryRepository(SubcollectionRepository):
    collection_name = "memories"

    def list_ai_usable(self, patient_id: str) -> list[dict[str, Any]]:
        """Memories approved and flagged for AI internal use (consent already
        applied at storage time via the `aiMayKnowInternally`/`approved`
        flags)."""
        query = (
            self._collection(patient_id)
            .where("approved", "==", True)
            .where("aiMayKnowInternally", "==", True)
        )
        docs = safe_call(query.get)
        return [d for d in (doc_to_dict(s) for s in docs) if d is not None]

    def list_patient_visible(self, patient_id: str) -> list[dict[str, Any]]:
        query = (
            self._collection(patient_id)
            .where("approved", "==", True)
            .where("visibleToPatient", "==", True)
        )
        docs = safe_call(query.get)
        return [d for d in (doc_to_dict(s) for s in docs) if d is not None]
