"""Patient-facing conversation endpoints. Authenticated via the patient
device session (issued at pairing), not caregiver Firebase auth (spec
section 9-11) - and the patientId in the request body/path must match the
patient bound to the presented device token."""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, UploadFile

from app.core.exceptions import AuthorizationError
from app.core.rate_limit import voice_upload_limiter
from app.core.security import AuthenticatedDevice
from app.dependencies import get_current_device
from app.schemas.conversation import (
    ConversationResponse,
    HelpContacts,
    HelpRequestPayload,
    RequestHelpResponse,
    TextConversationRequest,
)
from app.services.conversation_service import ConversationService
from app.utils.audio import validate_voice_upload

router = APIRouter(prefix="/conversations", tags=["Conversation"])
help_router = APIRouter(prefix="/patients", tags=["Conversation"])


def _ensure_own_patient(device: AuthenticatedDevice, patient_id: str) -> None:
    if device.patient_id != patient_id:
        raise AuthorizationError("Device is not authorized for this patient.")


@router.post("/text", response_model=ConversationResponse)
async def text_conversation(
    payload: TextConversationRequest,
    device: AuthenticatedDevice = Depends(get_current_device),
) -> ConversationResponse:
    _ensure_own_patient(device, payload.patientId)
    service = ConversationService()
    result = await service.process_text(payload.patientId, payload.conversationId, payload.text)
    return ConversationResponse(**result.model_dump())


@router.post("/voice", response_model=ConversationResponse)
async def voice_conversation(
    patientId: str = Form(...),
    conversationId: str | None = Form(default=None),
    audio: UploadFile = File(...),
    device: AuthenticatedDevice = Depends(get_current_device),
) -> ConversationResponse:
    _ensure_own_patient(device, patientId)
    voice_upload_limiter.check(device.device_id)

    audio_bytes = await audio.read()
    validate_voice_upload(audio.content_type, len(audio_bytes))

    service = ConversationService()
    result = await service.process_voice(
        patientId, conversationId, audio_bytes, audio.filename or "audio.webm", audio.content_type or "audio/webm"
    )
    return ConversationResponse(**result.model_dump())


@help_router.post("/{patient_id}/help", response_model=RequestHelpResponse)
async def request_help(
    patient_id: str,
    payload: HelpRequestPayload | None = None,
    device: AuthenticatedDevice = Depends(get_current_device),
) -> RequestHelpResponse:
    _ensure_own_patient(device, patient_id)
    service = ConversationService()
    result = service.create_help_request(patient_id, reason=payload.reason if payload else None)
    return RequestHelpResponse(**result)


@help_router.get("/{patient_id}/help/contacts", response_model=HelpContacts)
async def get_help_contacts(
    patient_id: str,
    device: AuthenticatedDevice = Depends(get_current_device),
) -> HelpContacts:
    _ensure_own_patient(device, patient_id)
    service = ConversationService()
    return HelpContacts(**service.get_help_contacts(patient_id))
