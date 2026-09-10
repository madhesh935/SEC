"""FastAPI dependency wiring: authentication, authorization and shared
singletons (embedding model, repositories, services)."""

from __future__ import annotations

from functools import lru_cache

from fastapi import Depends, Header

from app.ai.embeddings import EmbeddingEngine
from app.ai.llm_service import LLMService
from app.ai.orchestrator import InteractionOrchestrator
from app.ai.speech.stt import SpeechToTextService
from app.ai.speech.tts import TextToSpeechService
from app.core.exceptions import AuthenticationError, PatientNotFoundError
from app.core.permissions import require_caregiver_role, require_patient_access
from app.core.security import AuthenticatedDevice, AuthenticatedUser, decode_patient_token, verify_firebase_id_token
from app.database.repositories.activity_repository import ActivityRepository, CalmingStrategyRepository
from app.database.repositories.alert_repository import AlertCollectionGroupRepository, AlertRepository
from app.database.repositories.consent_repository import ConsentRepository
from app.database.repositories.conversation_repository import (
    ConversationEventRepository,
    ConversationRepository,
)
from app.database.repositories.device_repository import (
    CaregiverDeviceTokenRepository,
    PairingRepository,
    PatientDeviceRepository,
)
from app.database.repositories.event_repository import (
    BehaviourPatternRepository,
    DistressEventRepository,
    RepetitionEventRepository,
)
from app.database.repositories.family_repository import FamilyRepository
from app.database.repositories.memory_repository import MemoryRepository
from app.database.repositories.patient_repository import PatientRepository
from app.database.repositories.user_repository import UserRepository
from app.models.enums import UserRole


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthenticationError("Missing or malformed Authorization header.")
    return authorization.split(" ", 1)[1].strip()


async def get_current_user(authorization: str | None = Header(default=None)) -> AuthenticatedUser:
    token = _extract_bearer_token(authorization)
    decoded = verify_firebase_id_token(token)
    uid = decoded["uid"]
    email = decoded.get("email")

    user_repo = get_user_repository()
    user_doc = user_repo.get(uid)
    role = user_doc.get("role") if user_doc else None
    if role not in (UserRole.CAREGIVER, UserRole.FAMILY, UserRole.ADMIN):
        raise AuthenticationError("No authorized role is assigned to this account yet.")

    return AuthenticatedUser(uid=uid, email=email, role=role)


async def get_current_caregiver(user: AuthenticatedUser = Depends(get_current_user)) -> AuthenticatedUser:
    require_caregiver_role(user)
    return user


async def get_current_device(authorization: str | None = Header(default=None)) -> AuthenticatedDevice:
    token = _extract_bearer_token(authorization)
    return decode_patient_token(token, expected_type="access")


async def authorize_patient_access(
    patient_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
) -> dict:
    patient_repo = get_patient_repository()
    user_repo = get_user_repository()
    patient = patient_repo.get(patient_id)
    family_ids = user_repo.family_patient_ids(user.uid)
    return require_patient_access(user, patient, family_ids)


class PatientAccessContext:
    """Result of dual-mode access resolution for endpoints shared by the
    patient app (device session) and the caregiver/family website (Firebase
    user). `is_device` tells the route handler which sanitized shape to
    return - a patient device must never receive caregiver-only fields."""

    def __init__(self, patient: dict, is_device: bool) -> None:
        self.patient = patient
        self.is_device = is_device


async def get_patient_access_context(
    patient_id: str,
    authorization: str | None = Header(default=None),
) -> PatientAccessContext:
    token = _extract_bearer_token(authorization)
    patient_repo = get_patient_repository()

    try:
        device = decode_patient_token(token, expected_type="access")
    except AuthenticationError:
        device = None

    if device is not None:
        if device.patient_id != patient_id:
            raise AuthenticationError("Device is not authorized for this patient.")
        patient = patient_repo.get(patient_id)
        if not patient or patient.get("archived"):
            raise PatientNotFoundError("Patient profile was not found.")
        return PatientAccessContext(patient=patient, is_device=True)

    decoded = verify_firebase_id_token(token)
    uid = decoded["uid"]
    user_repo = get_user_repository()
    user_doc = user_repo.get(uid)
    role = user_doc.get("role") if user_doc else None
    if role not in (UserRole.CAREGIVER, UserRole.FAMILY, UserRole.ADMIN):
        raise AuthenticationError("No authorized role is assigned to this account yet.")
    user = AuthenticatedUser(uid=uid, email=decoded.get("email"), role=role)

    patient = patient_repo.get(patient_id)
    family_ids = user_repo.family_patient_ids(uid)
    resolved = require_patient_access(user, patient, family_ids)
    return PatientAccessContext(patient=resolved, is_device=False)


@lru_cache
def get_patient_repository() -> PatientRepository:
    return PatientRepository()


@lru_cache
def get_family_repository() -> FamilyRepository:
    return FamilyRepository()


@lru_cache
def get_memory_repository() -> MemoryRepository:
    return MemoryRepository()


@lru_cache
def get_conversation_repository() -> ConversationRepository:
    return ConversationRepository()


@lru_cache
def get_conversation_event_repository() -> ConversationEventRepository:
    return ConversationEventRepository()


@lru_cache
def get_repetition_event_repository() -> RepetitionEventRepository:
    return RepetitionEventRepository()


@lru_cache
def get_distress_event_repository() -> DistressEventRepository:
    return DistressEventRepository()


@lru_cache
def get_behaviour_pattern_repository() -> BehaviourPatternRepository:
    return BehaviourPatternRepository()


@lru_cache
def get_alert_repository() -> AlertRepository:
    return AlertRepository()


@lru_cache
def get_alert_collection_group_repository() -> AlertCollectionGroupRepository:
    return AlertCollectionGroupRepository()


@lru_cache
def get_consent_repository() -> ConsentRepository:
    return ConsentRepository()


@lru_cache
def get_user_repository() -> UserRepository:
    return UserRepository()


@lru_cache
def get_pairing_repository() -> PairingRepository:
    return PairingRepository()


@lru_cache
def get_caregiver_device_token_repository() -> CaregiverDeviceTokenRepository:
    return CaregiverDeviceTokenRepository()


@lru_cache
def get_patient_device_repository() -> PatientDeviceRepository:
    return PatientDeviceRepository()


@lru_cache
def get_activity_repository() -> ActivityRepository:
    return ActivityRepository()


@lru_cache
def get_calming_strategy_repository() -> CalmingStrategyRepository:
    return CalmingStrategyRepository()


@lru_cache
def get_embedding_engine() -> EmbeddingEngine:
    return EmbeddingEngine()


@lru_cache
def get_llm_service() -> LLMService:
    return LLMService()


@lru_cache
def get_stt_service() -> SpeechToTextService:
    return SpeechToTextService()


@lru_cache
def get_tts_service() -> TextToSpeechService:
    return TextToSpeechService()


@lru_cache
def get_orchestrator() -> InteractionOrchestrator:
    return InteractionOrchestrator()
