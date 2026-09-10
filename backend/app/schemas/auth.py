from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.enums import UserRole


class UserProfile(BaseModel):
    uid: str
    email: str | None
    role: UserRole
    name: str | None = None
    avatarUrl: str | None = None


class RegisterUserRoleRequest(BaseModel):
    uid: str
    role: UserRole


class PairingCodeCreateResponse(BaseModel):
    pairing_code: str
    expires_at: str


class PairingPinCreateResponse(BaseModel):
    pin: str
    expires_at: str


class PairingVerifyRequest(BaseModel):
    pairingCode: str = Field(pattern=r"^[A-HJ-NP-Z2-9]{8}$")
    deviceId: str = Field(min_length=8, max_length=128, pattern=r"^[A-Za-z0-9_-]+$")


class PairingVerifyPinRequest(BaseModel):
    pin: str = Field(pattern=r"^\d{4}$")
    deviceId: str = Field(min_length=8, max_length=128, pattern=r"^[A-Za-z0-9_-]+$")


class PairingVerifyResponse(BaseModel):
    accessToken: str
    refreshToken: str
    patientId: str
    patientPreferredName: str | None = None


class RefreshRequestBody(BaseModel):
    """POST /api/v1/auth/refresh is shared by both frontends. When
    refreshToken+deviceId are both present, it's the patient app's device
    session refresh; otherwise it's the caregiver website's Firebase-ID-token
    liveness check via the Authorization header (see api/v1/auth.py)."""

    refreshToken: str | None = None
    deviceId: str | None = None


class DeviceRefreshResponse(BaseModel):
    accessToken: str
    refreshToken: str


class CaregiverTokenResponse(BaseModel):
    """Response shape for the website's login/google/refresh flows. `token`
    is a Firebase ID token (verified server-side on every subsequent
    request) - this backend never mints or stores its own password-based
    session, it only brokers Identity Toolkit / Firebase Admin calls."""

    token: str
    user: UserProfile


class EmailPasswordLoginRequest(BaseModel):
    email: str
    password: str = Field(min_length=1)


class EmailPasswordSignupRequest(BaseModel):
    name: str | None = None
    email: str
    password: str = Field(min_length=6)


class GoogleLoginRequest(BaseModel):
    idToken: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ForgotPasswordResponse(BaseModel):
    success: bool
    message: str
