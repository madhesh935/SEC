"""Cross-patient caregiver alert listing and lifecycle (spec section 44)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from app.core.exceptions import ResourceNotFoundError
from app.core.security import AuthenticatedUser
from app.dependencies import (
    get_current_caregiver as get_current_user,
)
from app.dependencies import (
    get_patient_repository,
)
from app.schemas.alert import AlertActionRequest, AlertResponse
from app.services.alert_service import AlertService

router = APIRouter(prefix="/alerts", tags=["Alerts"])


def _authorized_patient_ids(user: AuthenticatedUser) -> list[str]:
    patient_repo = get_patient_repository()
    caregiver_patients = [p["id"] for p in patient_repo.list_for_caregiver(user.uid)]
    return caregiver_patients


def _to_alert_response(alert: dict) -> AlertResponse:
    patient_repo = get_patient_repository()
    patient_name = None
    if alert.get("patientId"):
        patient = patient_repo.get(alert["patientId"])
        if patient:
            patient_name = patient.get("preferredName") or patient.get("firstName")

    created_at = alert.get("createdAt")
    acknowledged_at = alert.get("acknowledgedAt")
    resolved_at = alert.get("resolvedAt")

    return AlertResponse(
        **{
            **alert,
            "patientName": patient_name,
            "context": alert.get("contextSummary"),
            "createdAt": created_at.isoformat() if hasattr(created_at, "isoformat") else None,
            "acknowledgedAt": acknowledged_at.isoformat()
            if hasattr(acknowledged_at, "isoformat")
            else None,
            "resolvedAt": resolved_at.isoformat() if hasattr(resolved_at, "isoformat") else None,
        }
    )


@router.get("", response_model=list[AlertResponse])
async def list_alerts(
    status: str | None = Query(default=None),
    severity: str | None = Query(default=None),
    patientId: str | None = Query(default=None),
    user: AuthenticatedUser = Depends(get_current_user),
) -> list[AlertResponse]:
    patient_ids = _authorized_patient_ids(user)
    if patientId:
        patient_ids = [p for p in patient_ids if p == patientId]

    service = AlertService()
    return [_to_alert_response(a) for a in service.list_alerts(patient_ids, status, severity)]


def _find_alert(user: AuthenticatedUser, alert_id: str) -> tuple[str, dict]:
    patient_ids = _authorized_patient_ids(user)
    service = AlertService()
    for patient_id in patient_ids:
        alert = service.alert_repository.get(patient_id, alert_id)
        if alert:
            return patient_id, alert
    raise ResourceNotFoundError("Alert was not found.")


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: str, user: AuthenticatedUser = Depends(get_current_user)
) -> AlertResponse:
    patient_id, alert = _find_alert(user, alert_id)
    return _to_alert_response({**alert, "patientId": patient_id})


@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(
    alert_id: str,
    payload: AlertActionRequest | None = None,
    user: AuthenticatedUser = Depends(get_current_user),
) -> AlertResponse:
    patient_id, _ = _find_alert(user, alert_id)
    service = AlertService()
    updated = service.acknowledge(patient_id, alert_id, user.uid, payload.note if payload else None)
    return _to_alert_response({**updated, "patientId": patient_id})


@router.post("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(
    alert_id: str,
    payload: AlertActionRequest | None = None,
    user: AuthenticatedUser = Depends(get_current_user),
) -> AlertResponse:
    patient_id, _ = _find_alert(user, alert_id)
    service = AlertService()
    updated = service.resolve(patient_id, alert_id, user.uid, payload.note if payload else None)
    return _to_alert_response({**updated, "patientId": patient_id})
