from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.core.permissions import require_patient_access
from app.core.security import AuthenticatedUser
from app.dependencies import get_current_user, get_patient_repository, get_user_repository
from app.schemas.media import MediaUploadResponse
from app.services.media_service import MediaService, UploadType

router = APIRouter(prefix="/media", tags=["Media"])


@router.post("/upload", response_model=MediaUploadResponse)
async def upload_media(
    type: UploadType = Form(...),
    patientId: str | None = Form(default=None),
    file: UploadFile = File(...),
    user: AuthenticatedUser = Depends(get_current_user),
) -> MediaUploadResponse:
    if patientId:
        patient_repo = get_patient_repository()
        user_repo = get_user_repository()
        patient = patient_repo.get(patientId)
        require_patient_access(user, patient, user_repo.family_patient_ids(user.uid))

    data = await file.read()
    service = MediaService()
    result = service.upload(
        user.uid,
        type,
        file.filename or "upload",
        file.content_type or "",
        data,
        patient_id=patientId,
    )
    return MediaUploadResponse(**result)


@router.delete("/{media_id}", status_code=204)
async def delete_media(
    media_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
) -> None:
    patient_repo = get_patient_repository()
    user_repo = get_user_repository()
    patients = patient_repo.list_for_caregiver(user.uid)
    authorized_ids = [p["id"] for p in patients] + user_repo.family_patient_ids(user.uid)

    service = MediaService()
    service.delete(user.uid, media_id, authorized_ids)
