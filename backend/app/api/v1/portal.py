from fastapi import APIRouter, Depends, Query

from app.core.exceptions import AuthorizationError
from app.core.security import hash_pairing_code, verify_firebase_id_token
from app.database.repositories.activity_repository import ActivityRepository
from app.database.repositories.device_repository import PatientDeviceRepository
from app.dependencies import authorize_patient_access, get_current_device, get_current_user
from app.schemas.auth import CaregiverTokenResponse, UserProfile
from app.schemas.patient_experience import ActivityFeedback
from app.schemas.portal import (
    AccessGrant,
    AccessUpdate,
    ActivityConfiguration,
    ConnectionSuggestion,
    DashboardSummary,
    DeviceRecord,
    FamilyContribution,
    FamilyMemory,
    FamilyNotification,
    FamilyPatient,
    InvitationRequest,
    InvitationResponse,
    ManagedActivity,
    SessionExchange,
    UnifiedActivityEvent,
    UserPreferences,
    UserProfileUpdate,
)
from app.services.auth_service import AuthService
from app.services.family_portal_service import FamilyPortalService
from app.services.portal_service import PortalService

router = APIRouter(tags=["Web Portal"])


@router.post("/auth/session", response_model=CaregiverTokenResponse)
async def session(payload: SessionExchange):
    decoded = verify_firebase_id_token(payload.idToken)
    if payload.invitationToken:
        FamilyPortalService().invitations.accept(
            hash_pairing_code(payload.invitationToken), decoded["uid"], decoded.get("email", "")
        )
    profile = AuthService().get_profile(decoded["uid"], decoded.get("email"))
    return CaregiverTokenResponse(token=payload.idToken, user=UserProfile(**profile))


@router.post("/auth/caregiver-registration", response_model=CaregiverTokenResponse)
async def caregiver_registration(payload: SessionExchange):
    decoded = verify_firebase_id_token(payload.idToken)
    profile = AuthService().get_or_create_profile(decoded["uid"], decoded.get("email"))
    return CaregiverTokenResponse(token=payload.idToken, user=UserProfile(**profile))


@router.get("/users/me/preferences", response_model=UserPreferences)
async def preferences(user=Depends(get_current_user)):
    return PortalService().preferences(user.uid)


@router.put("/users/me/preferences", response_model=UserPreferences)
async def save_preferences(payload: UserPreferences, user=Depends(get_current_user)):
    return PortalService().save_preferences(user.uid, payload)


@router.put("/users/me/profile", response_model=UserProfileUpdate)
async def save_profile(payload: UserProfileUpdate, user=Depends(get_current_user)):
    return PortalService().save_profile(user.uid, payload)


@router.post("/patients/{patient_id}/invitations", response_model=InvitationResponse)
async def invite(
    payload: InvitationRequest,
    patient=Depends(authorize_patient_access),
    user=Depends(get_current_user),
):
    return FamilyPortalService().invite(patient, user.uid, payload)


@router.get("/patients/{patient_id}/family-access", response_model=list[AccessGrant])
async def grants(patient=Depends(authorize_patient_access)):
    return FamilyPortalService().access.list(patient["id"], order_by=None, limit=200)


@router.put("/patients/{patient_id}/family-access/{user_id}", response_model=AccessGrant)
async def update_grant(
    user_id: str, payload: AccessUpdate, patient=Depends(authorize_patient_access)
):
    repo = FamilyPortalService().access
    if not repo.get(patient["id"], user_id):
        raise AuthorizationError("Membership is not available.")
    repo.update(patient["id"], user_id, payload.model_dump())
    return repo.get(patient["id"], user_id)


@router.get("/patients/{patient_id}/devices", response_model=list[DeviceRecord])
async def devices(patient=Depends(authorize_patient_access)):
    return PortalService().devices(patient)


@router.delete("/patients/{patient_id}/devices/{device_id}", status_code=204)
async def revoke(device_id: str, patient=Depends(authorize_patient_access)):
    PatientDeviceRepository().revoke(patient["id"], device_id)


@router.post("/auth/device-heartbeat", status_code=204)
async def heartbeat(device=Depends(get_current_device)):
    PatientDeviceRepository().touch(device.patient_id, device.device_id)


@router.get("/patients/{patient_id}/dashboard", response_model=DashboardSummary)
async def dashboard(patient=Depends(authorize_patient_access)):
    return PortalService().dashboard(patient)


@router.get(
    "/patients/{patient_id}/unified-activity", response_model=list[UnifiedActivityEvent]
)
async def unified_activity(
    limit: int = Query(default=10, ge=1, le=50),
    patient=Depends(authorize_patient_access),
):
    return PortalService().unified_activity(patient, limit=limit)


@router.get("/patients/{patient_id}/activity-management", response_model=list[ManagedActivity])
async def managed_activities(patient=Depends(authorize_patient_access)):
    return PortalService().activities(patient)


@router.put("/patients/{patient_id}/activity-management", response_model=ActivityConfiguration)
async def configure_activity(
    payload: ActivityConfiguration, patient=Depends(authorize_patient_access)
):
    return PortalService().configure_activity(patient, payload)


@router.get("/patients/{patient_id}/activity-results", response_model=list[ActivityFeedback])
async def results(patient=Depends(authorize_patient_access)):
    return [r for r in ActivityRepository().list(patient["id"], limit=200) if r.get("activityId")]


async def family_user(user=Depends(get_current_user)):
    if user.role != "family":
        raise AuthorizationError("This page is for authorized family members.")
    return user


@router.get("/family/patients", response_model=list[FamilyPatient])
async def family_patients(user=Depends(family_user)):
    return FamilyPortalService().list_patients(user.uid)


@router.get("/family/patients/{patient_id}", response_model=FamilyPatient)
async def family_profile(patient_id: str, user=Depends(family_user)):
    return FamilyPortalService().profile(user.uid, patient_id)


@router.get("/family/patients/{patient_id}/memories", response_model=list[FamilyMemory])
async def family_memories(patient_id: str, user=Depends(family_user)):
    return FamilyPortalService().shared_memories(user.uid, patient_id)


@router.post("/family/patients/{patient_id}/memories", response_model=FamilyMemory)
async def family_contribute(
    patient_id: str, payload: FamilyContribution, user=Depends(family_user)
):
    return FamilyPortalService().contribute(user.uid, patient_id, payload)


@router.get("/family/patients/{patient_id}/connection", response_model=list[ConnectionSuggestion])
async def family_connection(patient_id: str, user=Depends(family_user)):
    return FamilyPortalService().suggestions(user.uid, patient_id)


@router.get("/family/patients/{patient_id}/notifications", response_model=list[FamilyNotification])
async def family_notifications(patient_id: str, user=Depends(family_user)):
    return FamilyPortalService().notifications(user.uid, patient_id)
