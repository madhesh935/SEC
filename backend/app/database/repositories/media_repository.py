"""Top-level media metadata records, keyed by a generated mediaId so
DELETE /media/{mediaId} can resolve ownership without the patient in path."""

from __future__ import annotations

from typing import Any

from app.database.firebase import server_timestamp
from app.database.firestore import db, doc_to_dict, safe_call


class MediaRepository:
    def _collection(self):
        return db().collection("media")

    def create(self, data: dict[str, Any]) -> dict[str, Any]:
        ref = self._collection().document()
        payload = {**data, "createdAt": server_timestamp()}
        safe_call(ref.set, payload)
        return {**data, "id": ref.id}

    def get(self, media_id: str) -> dict[str, Any] | None:
        snapshot = safe_call(self._collection().document(media_id).get)
        return doc_to_dict(snapshot)

    def delete(self, media_id: str) -> None:
        safe_call(self._collection().document(media_id).delete)
