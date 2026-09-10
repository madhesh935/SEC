"""Caregiver alert records."""

from __future__ import annotations

import datetime as dt
import uuid
from typing import Any

from google.cloud.firestore_v1 import ArrayUnion

from app.database.firebase import server_timestamp
from app.database.firestore import doc_to_dict, patient_doc, safe_call
from app.database.repositories.base_repository import SubcollectionRepository


class AlertRepository(SubcollectionRepository):
    collection_name = "alerts"

    def list_by_status(
        self, patient_id: str, status: str | None, limit: int = 50
    ) -> list[dict[str, Any]]:
        query = self._collection(patient_id)
        if status:
            query = query.where("status", "==", status)
        query = query.order_by("createdAt", direction="DESCENDING").limit(limit)
        docs = safe_call(query.get)
        return [d for d in (doc_to_dict(s) for s in docs) if d is not None]

    def acknowledge(
        self, patient_id: str, alert_id: str, performed_by: str, note: str | None = None
    ) -> None:
        # Firestore's ArrayUnion cannot contain a SERVER_TIMESTAMP sentinel
        # inside an array element, so each action-history entry gets a
        # client-generated ISO timestamp instead of the document-level
        # server timestamp used for acknowledgedAt/resolvedAt.
        safe_call(
            self._collection(patient_id).document(alert_id).update,
            {
                "status": "ACKNOWLEDGED",
                "acknowledgedAt": server_timestamp(),
                "actionHistory": ArrayUnion(
                    [
                        {
                            "id": uuid.uuid4().hex,
                            "actionType": "ACKNOWLEDGE",
                            "performedBy": performed_by,
                            "note": note,
                            "timestamp": dt.datetime.now(dt.UTC).isoformat(),
                        }
                    ]
                ),
            },
        )

    def resolve(
        self, patient_id: str, alert_id: str, performed_by: str, note: str | None = None
    ) -> None:
        safe_call(
            self._collection(patient_id).document(alert_id).update,
            {
                "status": "RESOLVED",
                "resolvedAt": server_timestamp(),
                "actionHistory": ArrayUnion(
                    [
                        {
                            "id": uuid.uuid4().hex,
                            "actionType": "RESOLVE",
                            "performedBy": performed_by,
                            "note": note,
                            "timestamp": dt.datetime.now(dt.UTC).isoformat(),
                        }
                    ]
                ),
            },
        )


class AlertCollectionGroupRepository:
    """Cross-patient alert listing for a caregiver's dashboard."""

    def list_for_caregiver(
        self,
        patient_ids: list[str],
        status: str | None,
        severity: str | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        if not patient_ids:
            return []
        results: list[dict[str, Any]] = []
        for patient_id in patient_ids:
            query = patient_doc(patient_id).collection("alerts")
            if status:
                query = query.where("status", "==", status)
            if severity:
                query = query.where("severity", "==", severity)
            query = query.order_by("createdAt", direction="DESCENDING").limit(limit)
            docs = safe_call(query.get)
            for snapshot in docs:
                data = doc_to_dict(snapshot)
                if data:
                    data["patientId"] = patient_id
                    results.append(data)
        results.sort(key=lambda a: a.get("createdAt") or 0, reverse=True)
        return results[:limit]
