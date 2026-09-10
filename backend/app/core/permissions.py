"""Authorization rules. Patient IDs supplied by the frontend are never trusted
on their own - every access is checked against Firestore-held relationships.
"""

from __future__ import annotations

from app.core.exceptions import AuthorizationError, PatientNotFoundError
from app.core.security import AuthenticatedUser
from app.models.enums import UserRole


def require_caregiver_role(user: AuthenticatedUser) -> None:
    if user.role not in (UserRole.CAREGIVER, UserRole.ADMIN):
        raise AuthorizationError("This action requires caregiver privileges.")


def require_admin_role(user: AuthenticatedUser) -> None:
    if user.role != UserRole.ADMIN:
        raise AuthorizationError("This action requires administrator privileges.")


def require_patient_access(
    user: AuthenticatedUser, patient: dict | None, family_patient_ids: list[str]
) -> dict:
    if patient is None:
        raise PatientNotFoundError("Patient profile was not found.")

    if user.role == UserRole.ADMIN:
        return patient
    if user.role == UserRole.CAREGIVER and patient.get("primaryCaregiverId") == user.uid:
        return patient
    if user.role == UserRole.FAMILY and patient.get("id") in family_patient_ids:
        return patient

    raise AuthorizationError("You do not have access to this patient's records.")


def require_family_access(
    user: AuthenticatedUser, patient_id: str, family_patient_ids: list[str]
) -> None:
    if user.role == UserRole.ADMIN:
        return
    if user.role == UserRole.FAMILY and patient_id in family_patient_ids:
        return
    raise AuthorizationError("You do not have family access to this patient.")
