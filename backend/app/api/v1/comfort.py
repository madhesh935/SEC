"""Approved comfort content for the patient app (spec section 54). Only
patient-visible, approved content is ever returned here."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.dependencies import PatientAccessContext, get_patient_access_context
from app.models.enums import MemoryCategory
from app.schemas.activity import ComfortContentItem
from app.services.family_service import FamilyService
from app.services.memory_service import MemoryService

router = APIRouter(prefix="/patients/{patient_id}/comfort", tags=["Comfort"])


@router.get("", response_model=list[ComfortContentItem])
async def get_comfort_content(
    context: PatientAccessContext = Depends(get_patient_access_context),
) -> list[ComfortContentItem]:
    patient_id = context.patient["id"]
    memory_service = MemoryService()
    family_service = FamilyService()

    items: list[ComfortContentItem] = []
    for memory in memory_service.memory_repository.list_patient_visible(patient_id):
        if memory.get("category") == MemoryCategory.MUSIC.value and memory.get("audioUrl"):
            items.append(
                ComfortContentItem(
                    id=memory["id"],
                    type="music",
                    title=memory.get("title", ""),
                    mediaUrl=memory.get("audioUrl"),
                    imageUrl=memory.get("imageUrl"),
                    description=memory.get("description"),
                )
            )
        elif memory.get("audioUrl"):
            items.append(
                ComfortContentItem(
                    id=memory["id"],
                    type="memory",
                    title=memory.get("title", ""),
                    mediaUrl=memory.get("audioUrl"),
                    imageUrl=memory.get("imageUrl"),
                    description=memory.get("description"),
                )
            )
        elif memory.get("imageUrl"):
            items.append(
                ComfortContentItem(
                    id=memory["id"],
                    type="photo",
                    title=memory.get("title", ""),
                    imageUrl=memory.get("imageUrl"),
                    description=memory.get("description"),
                )
            )

    for member in family_service.family_repository.list_patient_visible(patient_id):
        if member.get("voiceRecordingUrl"):
            items.append(
                ComfortContentItem(
                    id=member["id"],
                    type="voice",
                    title=f"A message from {member.get('name')}",
                    mediaUrl=member.get("voiceRecordingUrl"),
                    imageUrl=member.get("photoUrl"),
                )
            )

    return items
