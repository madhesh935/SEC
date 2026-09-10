from __future__ import annotations

import datetime as dt

from fastapi import APIRouter, Depends, Query

from app.core.security import AuthenticatedUser
from app.dependencies import (
    PatientAccessContext,
    authorize_patient_access,
    get_current_user,
    get_patient_access_context,
)
from app.schemas.memory import MemoryCreateRequest, MemoryResponse, MemoryUpdateRequest, PatientMemoryPublic
from app.services.memory_service import MemoryService

router = APIRouter(prefix="/patients/{patient_id}/memories", tags=["Memories"])


def _to_memory_response(memory: dict, patient_id: str) -> MemoryResponse:
    return MemoryResponse(**{**memory, "patientId": patient_id})


def _to_patient_memory(memory: dict) -> PatientMemoryPublic:
    created_at = memory.get("createdAt")
    display_date = created_at.isoformat() if hasattr(created_at, "isoformat") else None
    return PatientMemoryPublic(
        id=memory["id"],
        title=memory.get("title", ""),
        description=memory.get("description"),
        imageUrl=memory.get("imageUrl"),
        audioUrl=memory.get("audioUrl"),
        associatedPeople=memory.get("associatedPeople", []),
        displayDate=display_date,
    )


@router.get("", response_model=None)
async def list_memories(
    context: PatientAccessContext = Depends(get_patient_access_context),
    category: str | None = Query(default=None),
    sensitivity: str | None = Query(default=None),
    approved: bool | None = Query(default=None),
) -> list[MemoryResponse] | list[PatientMemoryPublic]:
    service = MemoryService()
    if context.is_device:
        visible = service.memory_repository.list_patient_visible(context.patient["id"])
        return [_to_patient_memory(m) for m in visible]

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
) -> MemoryResponse:
    service = MemoryService()
    created = service.create_memory(user.uid, patient["id"], payload)
    return _to_memory_response(created, patient["id"])


@router.get("/{memory_id}", response_model=None)
async def get_memory(
    memory_id: str,
    context: PatientAccessContext = Depends(get_patient_access_context),
) -> MemoryResponse | PatientMemoryPublic:
    service = MemoryService()
    memory = service.get_memory(context.patient["id"], memory_id)

    if context.is_device:
        if not (memory.get("approved") and memory.get("visibleToPatient")):
            from app.core.exceptions import ResourceNotFoundError

            raise ResourceNotFoundError("Memory was not found.")
        return _to_patient_memory(memory)

    return _to_memory_response(memory, context.patient["id"])


@router.put("/{memory_id}", response_model=MemoryResponse)
async def update_memory(
    memory_id: str,
    payload: MemoryUpdateRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    patient: dict = Depends(authorize_patient_access),
) -> MemoryResponse:
    service = MemoryService()
    updated = service.update_memory(user.uid, patient["id"], memory_id, payload)
    return _to_memory_response(updated, patient["id"])


@router.delete("/{memory_id}", status_code=204)
async def delete_memory(
    memory_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    patient: dict = Depends(authorize_patient_access),
) -> None:
    service = MemoryService()
    service.delete_memory(user.uid, patient["id"], memory_id)
