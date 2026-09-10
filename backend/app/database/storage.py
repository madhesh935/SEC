"""Firebase Storage helpers for media uploads."""

from __future__ import annotations

import uuid
from datetime import timedelta

from app.database.firebase import get_storage_bucket

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/mp4", "audio/wav", "audio/webm", "audio/m4a"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime"}
MAX_IMAGE_BYTES = 8 * 1024 * 1024
MAX_AUDIO_BYTES = 20 * 1024 * 1024
MAX_VIDEO_BYTES = 50 * 1024 * 1024


def build_storage_path(patient_id: str, category: str, extension: str) -> str:
    unique_name = uuid.uuid4().hex
    return f"patients/{patient_id}/{category}/{unique_name}.{extension.lstrip('.')}"


def build_unscoped_storage_path(uploader_uid: str, category: str, extension: str) -> str:
    """Used for uploads that happen before a patient record exists yet (e.g.
    a profile photo picked during the patient-creation wizard)."""
    unique_name = uuid.uuid4().hex
    return f"uploads/{uploader_uid}/{category}/{unique_name}.{extension.lstrip('.')}"


def upload_bytes(path: str, data: bytes, content_type: str) -> str:
    bucket = get_storage_bucket()
    blob = bucket.blob(path)
    blob.upload_from_string(data, content_type=content_type)
    return path


def delete_blob(path: str) -> None:
    bucket = get_storage_bucket()
    blob = bucket.blob(path)
    if blob.exists():
        blob.delete()


def signed_url(path: str, expires_minutes: int = 60) -> str:
    bucket = get_storage_bucket()
    blob = bucket.blob(path)
    return blob.generate_signed_url(expiration=timedelta(minutes=expires_minutes))
