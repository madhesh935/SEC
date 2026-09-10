"""Authenticated-user profile lookups and role assignment.

Role assignment is normally an admin-only workflow (spec section 10) - the
frontend never gets to declare its own role. The one bootstrap exception is
`get_or_create_profile`, used by the website's login/Google sign-in
exchange: the FIRST time a brand-new Firebase account is ever seen, it is
granted the `caregiver` role automatically (configurable via
DEFAULT_CAREGIVER_ROLE_ON_FIRST_LOGIN) so there is a way to start using the
product at all. Every subsequent request re-reads the role from Firestore,
never from a client-asserted claim, and further role changes go through the
audited admin-only endpoint.
"""

from __future__ import annotations

from firebase_admin import auth as firebase_auth

from app.config import get_settings
from app.core.audit import audit_log
from app.core.exceptions import AuthenticationError
from app.database.repositories.user_repository import UserRepository
from app.models.enums import UserRole


class AuthService:
    def __init__(self, user_repository: UserRepository | None = None) -> None:
        self.user_repository = user_repository or UserRepository()

    def get_profile(self, uid: str, email: str | None) -> dict:
        user = self.user_repository.get(uid)
        if not user:
            raise AuthenticationError("No authorized role is assigned to this account yet.")
        return {
            "uid": uid,
            "email": email,
            "role": user.get("role"),
            "name": user.get("name"),
            "avatarUrl": user.get("avatarUrl"),
        }

    def get_or_create_profile(self, uid: str, email: str | None) -> dict:
        """Used by the website's login/Google-sign-in exchange only."""
        user = self.user_repository.get(uid)
        if user:
            return {
                "uid": uid,
                "email": email,
                "role": user.get("role"),
                "name": user.get("name"),
                "avatarUrl": user.get("avatarUrl"),
            }

        settings = get_settings()
        if not settings.default_caregiver_role_on_first_login:
            raise AuthenticationError("No authorized role is assigned to this account yet.")

        firebase_user = None
        try:
            firebase_user = firebase_auth.get_user(uid)
        except Exception:
            pass

        name = firebase_user.display_name if firebase_user else None
        avatar_url = firebase_user.photo_url if firebase_user else None

        created = self.user_repository.upsert(
            uid, {"role": UserRole.CAREGIVER.value, "name": name, "avatarUrl": avatar_url}
        )
        audit_log("user_role_bootstrapped", uid, role=UserRole.CAREGIVER.value)
        return {
            "uid": uid,
            "email": email,
            "role": created["role"],
            "name": name,
            "avatarUrl": avatar_url,
        }

    def assign_role(self, actor_uid: str, target_uid: str, role: UserRole) -> dict:
        updated = self.user_repository.upsert(target_uid, {"role": role.value})
        audit_log("user_role_assigned", actor_uid, target_uid=target_uid, role=role.value)
        return updated
