from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.core.permissions import require_patient_access
from app.core.rate_limit import pairing_verify_limiter
from app.core.security import AuthenticatedUser
from app.dependencies import get_current_caregiver, get_patient_repository, get_user_repository
from app.schemas.auth import (
    PairingCodeCreateResponse,
    PairingPinCreateResponse,
    PairingVerifyPinRequest,
    PairingVerifyRequest,
    PairingVerifyResponse,
)
from app.services.pairing_service import PairingService

router = APIRouter(prefix="/pairing", tags=["Pairing"])


def _authorize_caregiver_for_patient(user: AuthenticatedUser, patient_id: str) -> None:
    patient_repo = get_patient_repository()
    user_repo = get_user_repository()
    patient = patient_repo.get(patient_id)
    require_patient_access(user, patient, user_repo.family_patient_ids(user.uid))


@router.post("/{patient_id}/code", response_model=PairingCodeCreateResponse)
async def create_pairing_code(
    patient_id: str,
    user: AuthenticatedUser = Depends(get_current_caregiver),
) -> PairingCodeCreateResponse:
    _authorize_caregiver_for_patient(user, patient_id)
    result = PairingService().create_pairing_code(user.uid, patient_id)
    return PairingCodeCreateResponse(
        pairing_code=result["pairing_code"], expires_at=result["expires_at"]
    )


@router.post("/{patient_id}/pin", response_model=PairingPinCreateResponse)
async def create_pairing_pin(
    patient_id: str,
    user: AuthenticatedUser = Depends(get_current_caregiver),
) -> PairingPinCreateResponse:
    _authorize_caregiver_for_patient(user, patient_id)
    result = PairingService().create_pairing_pin(user.uid, patient_id)
    return PairingPinCreateResponse(pin=result["pin"], expires_at=result["expires_at"])


@router.post("/verify", response_model=PairingVerifyResponse)
async def verify_pairing(payload: PairingVerifyRequest, request: Request) -> PairingVerifyResponse:
    pairing_verify_limiter.check("ip:" + (request.client.host if request.client else "unknown"))
    pairing_verify_limiter.check(payload.deviceId)
    result = PairingService().verify_pairing(payload.pairingCode, payload.deviceId)
    return PairingVerifyResponse(**result)


@router.post("/verify-pin", response_model=PairingVerifyResponse)
async def verify_pairing_pin(
    payload: PairingVerifyPinRequest, request: Request
) -> PairingVerifyResponse:
    pairing_verify_limiter.check("ip:" + (request.client.host if request.client else "unknown"))
    pairing_verify_limiter.check(payload.deviceId)
    result = PairingService().verify_pin(payload.pin, payload.deviceId)
    return PairingVerifyResponse(**result)
