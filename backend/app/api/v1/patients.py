from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.core.security import AuthenticatedUser
from app.dependencies import (
    PatientAccessContext,
    authorize_patient_access,
    get_current_caregiver,
    get_current_user,
    get_patient_access_context,
)
from app.schemas.conversation import ConversationEvent
from app.schemas.patient import (
    PatientAdmin,
    PatientCreateRequest,
    PatientLiveStatusResponse,
    PatientPublic,
    PatientStatusResponse,
    PatientUpdateRequest,
)
from app.services.analytics_service import AnalyticsService
from app.services.conversation_service import ConversationService
from app.services.patient_content_service import PatientContentService
from app.services.patient_service import PatientService

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("", response_model=PatientAdmin)
async def create_patient(
    payload: PatientCreateRequest,
    user: AuthenticatedUser = Depends(get_current_caregiver),
) -> PatientAdmin:
    service = PatientService()
    created = service.create_patient(user.uid, payload)
    return PatientAdmin(**created)


@router.get("", response_model=list[PatientAdmin])
async def list_patients(
    user: AuthenticatedUser = Depends(get_current_caregiver),
) -> list[PatientAdmin]:
    service = PatientService()
    patients = service.list_for_caregiver(user.uid)
    return [PatientAdmin(**p) for p in patients]


@router.get("/{patient_id}", response_model=None)
async def get_patient(
    context: PatientAccessContext = Depends(get_patient_access_context),
) -> PatientAdmin | PatientPublic:
    if context.is_device:
        content = PatientContentService(context.patient)
        data = dict(context.patient)
        data["profilePhotoUrl"] = (
            content.media_url(data.get("profilePhotoUrl"))
            if content.consent.get("photosUsage", True)
            else None
        )
        return PatientPublic(**data)
    enriched = PatientService().get_patient(context.patient["id"], include_last_interaction=True)
    return PatientAdmin(**enriched)


@router.put("/{patient_id}", response_model=PatientAdmin)
async def update_patient(
    patient_id: str,
    payload: PatientUpdateRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    _patient: dict = Depends(authorize_patient_access),
) -> PatientAdmin:
    service = PatientService()
    updated = service.update_patient(user.uid, patient_id, payload)
    return PatientAdmin(**updated)


@router.delete("/{patient_id}", status_code=204)
async def archive_patient(
    patient_id: str,
    user: AuthenticatedUser = Depends(get_current_caregiver),
    _patient: dict = Depends(authorize_patient_access),
) -> None:
    service = PatientService()
    service.archive_patient(user.uid, patient_id)


@router.get("/{patient_id}/status", response_model=PatientStatusResponse)
async def get_patient_status(
    patient: dict = Depends(authorize_patient_access),
) -> PatientStatusResponse:
    service = ConversationService()
    status = service.get_patient_status(patient["id"])
    return PatientStatusResponse(**status)


@router.get("/{patient_id}/live-status", response_model=PatientLiveStatusResponse)
async def get_live_status(
    patient: dict = Depends(authorize_patient_access),
) -> PatientLiveStatusResponse:
    service = ConversationService()
    status = service.get_live_status(patient["id"])
    return PatientLiveStatusResponse(**status)


@router.get("/{patient_id}/events", response_model=list[ConversationEvent])
async def get_recent_events(
    limit: int = Query(default=10, ge=1, le=100),
    patient: dict = Depends(authorize_patient_access),
) -> list[ConversationEvent]:
    service = AnalyticsService()
    return [ConversationEvent(**e) for e in service.recent_events(patient["id"], limit=limit)]
