"""Conversation session records and bounded recent-history retrieval.

Only a limited recent window is ever returned - unlimited history must never
be passed to the LLM (backend spec section 17B).
"""

from __future__ import annotations

from typing import Any

from app.database.firestore import doc_to_dict, safe_call
from app.database.repositories.base_repository import SubcollectionRepository


class ConversationRepository(SubcollectionRepository):
    collection_name = "conversations"

    def get_or_create(self, patient_id: str, conversation_id: str | None) -> dict[str, Any]:
        if conversation_id:
            existing = self.get(patient_id, conversation_id)
            if existing:
                return existing
        return self.create(patient_id, {"status": "active"}, doc_id=conversation_id)


class ConversationEventRepository(SubcollectionRepository):
    collection_name = "conversation_events"

    def recent_for_conversation(
        self, patient_id: str, conversation_id: str, limit: int = 6
    ) -> list[dict[str, Any]]:
        query = (
            self._collection(patient_id)
            .where("conversationId", "==", conversation_id)
            .order_by("createdAt", direction="DESCENDING")
            .limit(limit)
        )
        docs = safe_call(query.get)
        events = [d for d in (doc_to_dict(s) for s in docs) if d is not None]
        return list(reversed(events))

    def recent_for_patient(self, patient_id: str, limit: int = 20) -> list[dict[str, Any]]:
        return self.list(patient_id, limit=limit, order_by="createdAt", descending=True)
