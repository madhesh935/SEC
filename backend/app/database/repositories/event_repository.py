"""Repetition, distress and behaviour-pattern event repositories used for
strategy inputs and caregiver analytics."""

from __future__ import annotations

import datetime as dt
from typing import Any

from app.database.firestore import doc_to_dict, safe_call
from app.database.repositories.base_repository import SubcollectionRepository


class RepetitionEventRepository(SubcollectionRepository):
    collection_name = "repetition_events"

    def since(self, patient_id: str, since: dt.datetime, limit: int = 500) -> list[dict[str, Any]]:
        query = (
            self._collection(patient_id)
            .where("createdAt", ">=", since)
            .order_by("createdAt", direction="DESCENDING")
            .limit(limit)
        )
        docs = safe_call(query.get)
        return [d for d in (doc_to_dict(s) for s in docs) if d is not None]


class DistressEventRepository(SubcollectionRepository):
    collection_name = "distress_events"

    def since(self, patient_id: str, since: dt.datetime, limit: int = 500) -> list[dict[str, Any]]:
        query = (
            self._collection(patient_id)
            .where("createdAt", ">=", since)
            .order_by("createdAt", direction="DESCENDING")
            .limit(limit)
        )
        docs = safe_call(query.get)
        return [d for d in (doc_to_dict(s) for s in docs) if d is not None]

    def latest(self, patient_id: str) -> dict[str, Any] | None:
        results = self.list(patient_id, limit=1, order_by="createdAt", descending=True)
        return results[0] if results else None


class BehaviourPatternRepository(SubcollectionRepository):
    collection_name = "behaviour_patterns"
