"""Secure media uploads (spec section 16). Validates MIME type and size;
never trusts the frontend-supplied filename for storage paths.

Matches the caregiver website's upload contract: `type` is one of
photo/audio/memory (not the original spec's five-way MediaCategory), and
`patientId` is optional - the patient-creation wizard uploads a profile
photo before the patient record exists yet.
"""

from __future__ import annotations

from typing import Literal

from app.core.audit import audit_log
from app.core.exceptions import AuthorizationError, ResourceNotFoundError, ValidationError
from app.database.repositories.media_repository import MediaRepository
from app.database.storage import (
    ALLOWED_AUDIO_TYPES,
    ALLOWED_IMAGE_TYPES,
    ALLOWED_VIDEO_TYPES,
    MAX_AUDIO_BYTES,
    MAX_IMAGE_BYTES,
    MAX_VIDEO_BYTES,
    build_storage_path,
    build_unscoped_storage_path,
    delete_blob,
    signed_url,
    upload_bytes,
)

UploadType = Literal["photo", "audio", "memory"]

_ALLOWED_TYPES_BY_UPLOAD_TYPE: dict[UploadType, set[str]] = {
    "photo": ALLOWED_IMAGE_TYPES,
    "audio": ALLOWED_AUDIO_TYPES,
    "memory": ALLOWED_IMAGE_TYPES | ALLOWED_AUDIO_TYPES | ALLOWED_VIDEO_TYPES,
}


def _media_type_for(content_type: str) -> str:
    if content_type in ALLOWED_IMAGE_TYPES:
        return "image"
    if content_type in ALLOWED_AUDIO_TYPES:
        return "audio"
    return "video"


def _max_bytes_for(content_type: str) -> int:
    if content_type in ALLOWED_VIDEO_TYPES:
        return MAX_VIDEO_BYTES
    if content_type in ALLOWED_AUDIO_TYPES:
        return MAX_AUDIO_BYTES
    return MAX_IMAGE_BYTES


class MediaService:
    def __init__(self, media_repository: MediaRepository | None = None) -> None:
        self.media_repository = media_repository or MediaRepository()

    def upload(
        self,
        actor_uid: str,
        upload_type: UploadType,
        filename: str,
        content_type: str,
        data: bytes,
        patient_id: str | None = None,
    ) -> dict:
        allowed_types = _ALLOWED_TYPES_BY_UPLOAD_TYPE.get(upload_type, ALLOWED_IMAGE_TYPES)
        if content_type not in allowed_types:
            raise ValidationError(f"Unsupported file type for upload type '{upload_type}'.")
        if len(data) > _max_bytes_for(content_type):
            raise ValidationError("File exceeds the maximum allowed size.")

        extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
        if patient_id:
            storage_path = build_storage_path(patient_id, upload_type, extension)
        else:
            storage_path = build_unscoped_storage_path(actor_uid, upload_type, extension)

        upload_bytes(storage_path, data, content_type)

        record = self.media_repository.create(
            {
                "patientId": patient_id,
                "category": upload_type,
                "storagePath": storage_path,
                "uploadedBy": actor_uid,
            }
        )
        audit_log("media_uploaded", actor_uid, patient_id=patient_id, media_id=record["id"], category=upload_type)

        url = signed_url(storage_path, expires_minutes=120)
        return {
            "url": url,
            "mediaType": _media_type_for(content_type),
            "fileName": filename,
            "sizeBytes": len(data),
        }

    def delete(self, actor_uid: str, media_id: str, authorized_patient_ids: list[str]) -> None:
        record = self.media_repository.get(media_id)
        if not record:
            raise ResourceNotFoundError("Media item was not found.")
        if record.get("patientId") not in authorized_patient_ids:
            raise AuthorizationError("You do not have access to this media item.")

        delete_blob(record["storagePath"])
        self.media_repository.delete(media_id)
        audit_log("media_deleted", actor_uid, patient_id=record.get("patientId"), media_id=media_id)
