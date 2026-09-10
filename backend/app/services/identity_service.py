"""Thin proxy to Google Identity Toolkit for the caregiver website's
email/password login and password-reset flows.

This backend never stores or verifies passwords itself - Identity Toolkit
(the REST API behind Firebase Authentication) does, using the project's
public web API key. A successful call returns a normal Firebase ID token,
which this backend then verifies the same way as any other caregiver
request (app/core/security.py::verify_firebase_id_token). No password ever
touches application code beyond this single outbound call.
"""

from __future__ import annotations

import httpx

from app.config import get_settings
from app.core.exceptions import AuthenticationError, ConflictError, ExternalServiceError, ValidationError

_TIMEOUT = httpx.Timeout(connect=5.0, read=15.0, write=5.0, pool=5.0)
_IDENTITY_TOOLKIT_BASE = "https://identitytoolkit.googleapis.com/v1"


class IdentityService:
    def __init__(self) -> None:
        self._settings = get_settings()

    def _require_api_key(self) -> str:
        if not self._settings.firebase_web_api_key:
            raise ExternalServiceError("Password sign-in is not configured on this server.")
        return self._settings.firebase_web_api_key

    async def sign_in_with_password(self, email: str, password: str) -> str:
        """Returns a Firebase ID token on success."""
        api_key = self._require_api_key()
        payload = {"email": email, "password": password, "returnSecureToken": True}

        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                response = await client.post(
                    f"{_IDENTITY_TOOLKIT_BASE}/accounts:signInWithPassword",
                    params={"key": api_key},
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise ExternalServiceError("Sign-in service is unreachable.") from exc

        if response.status_code >= 400:
            raise AuthenticationError("Incorrect email or password.")

        data = response.json()
        id_token = data.get("idToken")
        if not id_token:
            raise AuthenticationError("Sign-in failed.")
        return id_token

    async def sign_up_with_password(self, email: str, password: str, display_name: str | None = None) -> str:
        """Creates a new Firebase Auth user and returns a Firebase ID token
        for it, so the caller can be signed in immediately after signup.
        Unlike sign-in, signup failures are reported specifically (e.g.
        "email already registered") - that's expected, necessary UX for a
        registration form and not the same enumeration risk as login."""
        api_key = self._require_api_key()
        payload = {"email": email, "password": password, "returnSecureToken": True}

        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                response = await client.post(
                    f"{_IDENTITY_TOOLKIT_BASE}/accounts:signUp",
                    params={"key": api_key},
                    json=payload,
                )
        except httpx.HTTPError as exc:
            raise ExternalServiceError("Sign-up service is unreachable.") from exc

        if response.status_code >= 400:
            reason = response.json().get("error", {}).get("message", "")
            if reason == "EMAIL_EXISTS":
                raise ConflictError("An account with this email already exists.")
            if reason.startswith("WEAK_PASSWORD"):
                raise ValidationError("Password is too weak - use at least 6 characters.")
            if reason == "INVALID_EMAIL":
                raise ValidationError("Please enter a valid email address.")
            raise ValidationError("Unable to create the account.")

        data = response.json()
        id_token = data.get("idToken")
        local_id = data.get("localId")
        if not id_token or not local_id:
            raise ExternalServiceError("Sign-up failed.")

        if display_name:
            await self._set_display_name(id_token, display_name)

        return id_token

    async def _set_display_name(self, id_token: str, display_name: str) -> None:
        api_key = self._require_api_key()
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                await client.post(
                    f"{_IDENTITY_TOOLKIT_BASE}/accounts:update",
                    params={"key": api_key},
                    json={"idToken": id_token, "displayName": display_name, "returnSecureToken": False},
                )
        except httpx.HTTPError:
            pass

    async def send_password_reset_email(self, email: str) -> None:
        """Best-effort; never reveals whether the email is registered."""
        api_key = self._require_api_key()
        payload = {"requestType": "PASSWORD_RESET", "email": email}

        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                await client.post(
                    f"{_IDENTITY_TOOLKIT_BASE}/accounts:sendOobCode",
                    params={"key": api_key},
                    json=payload,
                )
        except httpx.HTTPError:
            # Deliberately swallowed: the caller always returns a generic
            # success message regardless, to avoid account enumeration.
            pass
