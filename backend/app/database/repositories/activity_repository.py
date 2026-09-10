"""Activities and calming-strategy usage records."""

from __future__ import annotations

import datetime as dt
from typing import Any

from app.database.repositories.base_repository import SubcollectionRepository
from app.database.firestore import doc_to_dict, safe_call


class ActivityRepository(SubcollectionRepository):
    collection_name = "activities"


class CalmingStrategyRepository(SubcollectionRepository):
    collection_name = "calming_strategies"

    def since(self, patient_id: str, since: dt.datetime, limit: int = 500) -> list[dict[str, Any]]:
        query = (
            self._collection(patient_id)
            .where("createdAt", ">=", since)
            .order_by("createdAt", direction="DESCENDING")
            .limit(limit)
        )
        docs = safe_call(query.get)
        return [d for d in (doc_to_dict(s) for s in docs) if d is not None]
