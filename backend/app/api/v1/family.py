from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.security import AuthenticatedUser
from app.dependencies import (
    PatientAccessContext,
    authorize_patient_access,
    get_current_user,
    get_patient_access_context,
)
from app.schemas.family import (
    FamilyCreateRequest,
    FamilyMember,
    FamilyMemberPublic,
    FamilyUpdateRequest,
)
from app.services.family_service import FamilyService
from app.services.patient_content_service import PatientContentService

router = APIRouter(prefix="/patients/{patient_id}/family", tags=["Family"])


def _to_family_member(member: dict, patient_id: str) -> FamilyMember:
    created_at = member.get("createdAt")
    return FamilyMember(
        **{
            **member,
            "patientId": patient_id,
            "createdAt": created_at.isoformat() if hasattr(created_at, "isoformat") else None,
        }
    )


@router.get("", response_model=None)
async def list_family(
    context: PatientAccessContext = Depends(get_patient_access_context),
) -> list[FamilyMember] | list[FamilyMemberPublic]:
    service = FamilyService()
    if context.is_device:
        return PatientContentService(context.patient).family()
    return [
        _to_family_member(m, context.patient["id"])
        for m in service.list_family(context.patient["id"])
    ]


@router.post("", response_model=FamilyMember)
async def create_family_member(
    payload: FamilyCreateRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    patient: dict = Depends(authorize_patient_access),
) -> FamilyMember:
    service = FamilyService()
    created = service.create_family_member(user.uid, patient["id"], payload)
    return _to_family_member(created, patient["id"])


@router.get("/{family_id}", response_model=None)
async def get_family_member(
    family_id: str,
    context: PatientAccessContext = Depends(get_patient_access_context),
) -> FamilyMember | FamilyMemberPublic:
    service = FamilyService()
    member = service.get_family_member(context.patient["id"], family_id)

    if context.is_device:
        return PatientContentService(context.patient).family_member(family_id)

    return _to_family_member(member, context.patient["id"])


@router.put("/{family_id}", response_model=FamilyMember)
async def update_family_member(
    family_id: str,
    payload: FamilyUpdateRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    patient: dict = Depends(authorize_patient_access),
) -> FamilyMember:
    service = FamilyService()
    updated = service.update_family_member(user.uid, patient["id"], family_id, payload)
    return _to_family_member(updated, patient["id"])


@router.delete("/{family_id}", status_code=204)
async def delete_family_member(
    family_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    patient: dict = Depends(authorize_patient_access),
) -> None:
    service = FamilyService()
    service.delete_family_member(user.uid, patient["id"], family_id)
