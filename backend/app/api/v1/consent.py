from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.audit import audit_log
from app.core.security import AuthenticatedUser
from app.dependencies import authorize_patient_access, get_current_user
from app.schemas.consent import ConsentSettings, ConsentUpdateRequest
from app.services.consent_service import ConsentService

router = APIRouter(prefix="/patients/{patient_id}/consent", tags=["Consent"])


@router.get("", response_model=ConsentSettings)
async def get_consent(patient: dict = Depends(authorize_patient_access)) -> ConsentSettings:
    service = ConsentService()
    consent = service.get_consent(patient["id"])
    return ConsentSettings(**service.to_website_shape(consent, patient["id"]))


@router.put("", response_model=ConsentSettings)
async def update_consent(
    payload: ConsentUpdateRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    patient: dict = Depends(authorize_patient_access),
) -> ConsentSettings:
    service = ConsentService()
    incoming = {k: v for k, v in payload.model_dump(mode="json").items() if v is not None}
    mapped = service.from_website_shape(incoming)
    updated = service.update_consent(patient["id"], mapped)
    audit_log("consent_changed", user.uid, patient_id=patient["id"], fields=list(mapped.keys()))
    return ConsentSettings(**service.to_website_shape(updated, patient["id"]))
