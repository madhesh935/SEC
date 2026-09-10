"""Generic Firestore subcollection repository.

Concrete repositories subclass this to avoid duplicating Firebase access
logic (see AGENTS/backend spec section 6 & 89: no duplicated Firebase logic).
"""

from __future__ import annotations

from typing import Any

from app.database.firebase import server_timestamp
from app.database.firestore import doc_to_dict, patient_doc, safe_call


class SubcollectionRepository:
    collection_name: str = ""

    def _collection(self, patient_id: str):
        return patient_doc(patient_id).collection(self.collection_name)

    def get(self, patient_id: str, doc_id: str) -> dict[str, Any] | None:
        snapshot = safe_call(self._collection(patient_id).document(doc_id).get)
        return doc_to_dict(snapshot)

    def list(
        self,
        patient_id: str,
        limit: int = 50,
        order_by: str | None = "createdAt",
        descending: bool = True,
        start_after: Any = None,
    ) -> list[dict[str, Any]]:
        query = self._collection(patient_id)
        if order_by:
            direction = "DESCENDING" if descending else "ASCENDING"
            query = query.order_by(order_by, direction=direction)
        if start_after is not None:
            query = query.start_after({order_by: start_after})
        query = query.limit(limit)
        docs = safe_call(query.get)
        return [d for d in (doc_to_dict(s) for s in docs) if d is not None]

    def create(self, patient_id: str, data: dict[str, Any], doc_id: str | None = None) -> dict:
        payload = {**data, "createdAt": server_timestamp(), "updatedAt": server_timestamp()}
        collection = self._collection(patient_id)
        if doc_id:
            ref = collection.document(doc_id)
            safe_call(ref.set, payload)
        else:
            ref = safe_call(collection.add, payload)[1]
        return {**data, "id": ref.id}

    def update(self, patient_id: str, doc_id: str, data: dict[str, Any]) -> None:
        payload = {**data, "updatedAt": server_timestamp()}
        safe_call(self._collection(patient_id).document(doc_id).update, payload)

    def delete(self, patient_id: str, doc_id: str) -> None:
        safe_call(self._collection(patient_id).document(doc_id).delete)
