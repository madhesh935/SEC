from __future__ import annotations

from pydantic import BaseModel, Field

from app.models.enums import AlertSeverity, AlertStatus


class AlertAction(BaseModel):
    id: str | None = None
    actionType: str
    performedBy: str
    timestamp: str | None = None
    note: str | None = None


class AlertResponse(BaseModel):
    id: str
    patientId: str | None = None
    patientName: str | None = None
    severity: AlertSeverity
    reason: str
    context: str | None = None
    status: AlertStatus
    createdAt: str | None = None
    acknowledgedAt: str | None = None
    resolvedAt: str | None = None
    actionHistory: list[AlertAction] = Field(default_factory=list)


class AlertActionRequest(BaseModel):
    note: str | None = None
