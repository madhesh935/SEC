from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.core.security import AuthenticatedUser
from app.dependencies import (
    PatientAccessContext,
    authorize_patient_access,
    get_current_user,
    get_memory_service,
    get_patient_access_context,
)
from app.schemas.memory import (
    MemoryCreateRequest,
    MemoryResponse,
    MemoryUpdateRequest,
    PatientMemoryPublic,
)
from app.services.memory_service import MemoryService
from app.services.patient_content_service import PatientContentService

router = APIRouter(prefix="/patients/{patient_id}/memories", tags=["Memories"])


def _to_memory_response(memory: dict, patient_id: str) -> MemoryResponse:
    return MemoryResponse(**{**memory, "patientId": patient_id})


@router.get("", response_model=None)
async def list_memories(
    context: PatientAccessContext = Depends(get_patient_access_context),
    category: str | None = Query(default=None),
    sensitivity: str | None = Query(default=None),
    approved: bool | None = Query(default=None),
    service: MemoryService = Depends(get_memory_service),
) -> list[MemoryResponse] | list[PatientMemoryPublic]:
    if context.is_device:
        visible = PatientContentService(context.patient).memories()
        return [m for m in visible if category is None or m.category == category]

    memories = service.list_memories(context.patient["id"])
    if category is not None:
        memories = [m for m in memories if m.get("category") == category]
    if sensitivity is not None:
        memories = [m for m in memories if m.get("sensitivity") == sensitivity]
    if approved is not None:
        memories = [m for m in memories if bool(m.get("approved")) == approved]
    return [_to_memory_response(m, context.patient["id"]) for m in memories]


@router.post("", response_model=MemoryResponse)
async def create_memory(
    payload: MemoryCreateRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    patient: dict = Depends(authorize_patient_access),
    service: MemoryService = Depends(get_memory_service),
) -> MemoryResponse:
    created = service.create_memory(user.uid, patient["id"], payload)
    return _to_memory_response(created, patient["id"])


@router.get("/{memory_id}", response_model=None)
async def get_memory(
    memory_id: str,
    context: PatientAccessContext = Depends(get_patient_access_context),
    service: MemoryService = Depends(get_memory_service),
) -> MemoryResponse | PatientMemoryPublic:
    memory = service.get_memory(context.patient["id"], memory_id)

    if context.is_device:
        return PatientContentService(context.patient).memory(memory_id)

    return _to_memory_response(memory, context.patient["id"])


@router.put("/{memory_id}", response_model=MemoryResponse)
async def update_memory(
    memory_id: str,
    payload: MemoryUpdateRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    patient: dict = Depends(authorize_patient_access),
    service: MemoryService = Depends(get_memory_service),
) -> MemoryResponse:
    updated = service.update_memory(user.uid, patient["id"], memory_id, payload)
    return _to_memory_response(updated, patient["id"])


@router.delete("/{memory_id}", status_code=204)
async def delete_memory(
    memory_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    patient: dict = Depends(authorize_patient_access),
    service: MemoryService = Depends(get_memory_service),
) -> None:
    service.delete_memory(user.uid, patient["id"], memory_id)
