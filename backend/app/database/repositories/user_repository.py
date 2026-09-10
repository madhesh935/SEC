"""users/{userId} - authoritative role assignment.

The frontend never gets to declare its own role; this collection, populated
by an admin/onboarding workflow, is the single source of truth checked on
every protected request.
"""

from __future__ import annotations

from typing import Any

from app.database.firebase import server_timestamp
from app.database.firestore import doc_to_dict, safe_call, users_collection


class UserRepository:
    def get(self, uid: str) -> dict[str, Any] | None:
        snapshot = safe_call(users_collection().document(uid).get)
        return doc_to_dict(snapshot)

    def upsert(self, uid: str, data: dict[str, Any]) -> dict[str, Any]:
        payload = {**data, "updatedAt": server_timestamp()}
        safe_call(users_collection().document(uid).set, payload, merge=True)
        return {**data, "id": uid}

    def family_patient_ids(self, uid: str) -> list[str]:
        user = self.get(uid)
        if not user:
            return []
        return user.get("familyPatientIds", [])
