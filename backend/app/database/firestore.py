"""Firestore helper utilities shared by repositories."""

from __future__ import annotations

from typing import Any

from google.api_core.exceptions import GoogleAPICallError
from google.cloud.firestore_v1 import CollectionReference, DocumentReference

from app.core.exceptions import DatabaseUnavailableError
from app.database.firebase import get_firestore_client


def db():
    return get_firestore_client()


def patients_collection() -> CollectionReference:
    return db().collection("patients")


def patient_doc(patient_id: str) -> DocumentReference:
    return patients_collection().document(patient_id)


def users_collection() -> CollectionReference:
    return db().collection("users")


def alerts_collection_group():
    return db().collection_group("alerts")


def safe_call(fn, *args, **kwargs):
    """Wrap a Firestore call and translate transport failures into a
    controlled DatabaseUnavailableError instead of letting personalized
    responses continue on guessed data."""
    try:
        return fn(*args, **kwargs)
    except GoogleAPICallError as exc:
        raise DatabaseUnavailableError("The database is temporarily unavailable.") from exc


def doc_to_dict(snapshot) -> dict[str, Any] | None:
    if snapshot is None or not snapshot.exists:
        return None
    data = snapshot.to_dict() or {}
    data["id"] = snapshot.id
    return data
