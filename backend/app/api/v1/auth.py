"""Caregiver/family/admin authentication.

Password and Google sign-in are brokered through Identity Toolkit / Firebase
Admin (app/services/identity_service.py) - this backend never stores a
password or mints its own session token. Every `token` returned here is a
normal Firebase ID token, verified the same way as any other request.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header

from app.core.exceptions import AuthenticationError
from app.core.permissions import require_admin_role
from app.core.rate_limit import auth_limiter
from app.core.security import AuthenticatedDevice, AuthenticatedUser, decode_patient_token, issue_patient_tokens, verify_firebase_id_token
from app.dependencies import get_current_user, get_patient_device_repository, get_patient_repository
from app.schemas.auth import (
    CaregiverTokenResponse,
    DeviceRefreshResponse,
    EmailPasswordLoginRequest,
    EmailPasswordSignupRequest,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    GoogleLoginRequest,
    RefreshRequestBody,
    RegisterUserRoleRequest,
    UserProfile,
)
from app.services.auth_service import AuthService
from app.services.identity_service import IdentityService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=CaregiverTokenResponse)
async def login(payload: EmailPasswordLoginRequest) -> CaregiverTokenResponse:
    auth_limiter.check(payload.email.lower())
    id_token = await IdentityService().sign_in_with_password(payload.email, payload.password)
    decoded = verify_firebase_id_token(id_token)
    profile = AuthService().get_or_create_profile(decoded["uid"], decoded.get("email"))
    return CaregiverTokenResponse(token=id_token, user=UserProfile(**profile))


@router.post("/signup", response_model=CaregiverTokenResponse)
async def signup(payload: EmailPasswordSignupRequest) -> CaregiverTokenResponse:
    auth_limiter.check(payload.email.lower())
    id_token = await IdentityService().sign_up_with_password(payload.email, payload.password, payload.name)
    decoded = verify_firebase_id_token(id_token)
    profile = AuthService().get_or_create_profile(decoded["uid"], decoded.get("email"))
    return CaregiverTokenResponse(token=id_token, user=UserProfile(**profile))


@router.post("/google", response_model=CaregiverTokenResponse)
async def login_with_google(payload: GoogleLoginRequest) -> CaregiverTokenResponse:
    decoded = verify_firebase_id_token(payload.idToken)
    profile = AuthService().get_or_create_profile(decoded["uid"], decoded.get("email"))
    return CaregiverTokenResponse(token=payload.idToken, user=UserProfile(**profile))


@router.post("/logout", status_code=204)
async def logout(user: AuthenticatedUser = Depends(get_current_user)) -> None:
    # Stateless Firebase ID tokens - nothing to invalidate server-side.
    return None


@router.post("/forgot-password", response_model=ForgotPasswordResponse)
async def forgot_password(payload: ForgotPasswordRequest) -> ForgotPasswordResponse:
    auth_limiter.check(payload.email.lower())
    await IdentityService().send_password_reset_email(payload.email)
    return ForgotPasswordResponse(
        success=True,
        message="If an account exists for that email, a password reset link has been sent.",
    )


@router.post("/refresh", response_model=None)
async def refresh(
    payload: RefreshRequestBody | None = None,
    authorization: str | None = Header(default=None),
) -> DeviceRefreshResponse | CaregiverTokenResponse:
    if payload and payload.refreshToken and payload.deviceId:
        device: AuthenticatedDevice = decode_patient_token(payload.refreshToken, expected_type="refresh")
        if device.device_id != payload.deviceId:
            raise AuthenticationError("Invalid device session token.")

        patient_repo = get_patient_repository()
        device_repo = get_patient_device_repository()
        patient = patient_repo.get(device.patient_id)
        if not patient or patient.get("archived") or not device_repo.is_bound(device.patient_id, device.device_id):
            raise AuthenticationError("Device session is no longer valid.")

        access_token, refresh_token = issue_patient_tokens(device.patient_id, device.device_id)
        return DeviceRefreshResponse(accessToken=access_token, refreshToken=refresh_token)

    if not authorization or not authorization.lower().startswith("bearer "):
        raise AuthenticationError("Missing or malformed Authorization header.")
    id_token = authorization.split(" ", 1)[1].strip()
    decoded = verify_firebase_id_token(id_token)
    profile = AuthService().get_profile(decoded["uid"], decoded.get("email"))
    return CaregiverTokenResponse(token=id_token, user=UserProfile(**profile))


@router.get("/me", response_model=UserProfile)
async def get_me(user: AuthenticatedUser = Depends(get_current_user)) -> UserProfile:
    profile = AuthService().get_profile(user.uid, user.email)
    return UserProfile(**profile)


@router.post("/roles", response_model=UserProfile)
async def assign_role(
    payload: RegisterUserRoleRequest,
    user: AuthenticatedUser = Depends(get_current_user),
) -> UserProfile:
    require_admin_role(user)
    updated = AuthService().assign_role(user.uid, payload.uid, payload.role)
    return UserProfile(uid=payload.uid, email=None, role=updated["role"])
