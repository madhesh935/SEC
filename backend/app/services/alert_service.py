"""Caregiver alert creation and lifecycle (spec sections 43-44)."""

from __future__ import annotations

from app.ai.distress_engine import DistressResult
from app.ai.safety_engine import SafetyAssessment
from app.ai.strategy_engine import StrategyDecision
from app.core.exceptions import ResourceNotFoundError
from app.database.repositories.alert_repository import AlertCollectionGroupRepository, AlertRepository
from app.database.repositories.patient_repository import PatientRepository
from app.models.enums import AlertSeverity, AlertStatus, DistressSeverity
from app.services.notification_service import NotificationService


class AlertService:
    def __init__(
        self,
        alert_repository: AlertRepository | None = None,
        alert_group_repository: AlertCollectionGroupRepository | None = None,
        patient_repository: PatientRepository | None = None,
        notification_service: NotificationService | None = None,
    ) -> None:
        self.alert_repository = alert_repository or AlertRepository()
        self.alert_group_repository = alert_group_repository or AlertCollectionGroupRepository()
        self.patient_repository = patient_repository or PatientRepository()
        self.notification_service = notification_service or NotificationService()

    def create_alert(
        self,
        patient_id: str,
        severity: AlertSeverity,
        reason: str,
        context_summary: str,
        event_id: str | None = None,
    ) -> dict:
        alert = self.alert_repository.create(
            patient_id,
            {
                "severity": severity.value,
                "reason": reason,
                "eventId": event_id,
                "contextSummary": context_summary,
                "status": AlertStatus.ACTIVE.value,
                "actionHistory": [],
            },
        )
        patient = self.patient_repository.get(patient_id)
        caregiver_id = patient.get("primaryCaregiverId") if patient else None
        if caregiver_id:
            self.notification_service.notify_caregiver_of_alert(caregiver_id, alert["id"], patient_id)
        return alert

    def maybe_create_alert(
        self,
        patient_id: str,
        distress: DistressResult,
        strategy: StrategyDecision,
        safety: SafetyAssessment,
        event_id: str | None,
    ) -> dict | None:
        if safety.emergencyDetected:
            return self.create_alert(
                patient_id,
                AlertSeverity.URGENT,
                "Possible emergency / immediate safety language detected.",
                "The AI companion detected language suggesting a possible emergency during a patient interaction.",
                event_id,
            )

        if not strategy.escalate and distress.severity in (DistressSeverity.LOW, DistressSeverity.MODERATE):
            return None

        severity_map = {
            DistressSeverity.MODERATE: AlertSeverity.MODERATE,
            DistressSeverity.HIGH: AlertSeverity.HIGH,
            DistressSeverity.URGENT: AlertSeverity.URGENT,
        }
        severity = severity_map.get(distress.severity, AlertSeverity.MODERATE)
        reason = strategy.escalationReason or f"Distress risk reached {distress.severity.value}."
        return self.create_alert(
            patient_id,
            severity,
            reason,
            "Observed distress signals during a patient interaction indicate this may need attention.",
            event_id,
        )

    def list_alerts(
        self, patient_ids: list[str], status: str | None, severity: str | None = None
    ) -> list[dict]:
        return self.alert_group_repository.list_for_caregiver(patient_ids, status, severity)

    def get_alert(self, patient_id: str, alert_id: str) -> dict:
        alert = self.alert_repository.get(patient_id, alert_id)
        if not alert:
            raise ResourceNotFoundError("Alert was not found.")
        return alert

    def acknowledge(self, patient_id: str, alert_id: str, performed_by: str, note: str | None = None) -> dict:
        self.get_alert(patient_id, alert_id)
        self.alert_repository.acknowledge(patient_id, alert_id, performed_by, note)
        return self.alert_repository.get(patient_id, alert_id)

    def resolve(self, patient_id: str, alert_id: str, performed_by: str, note: str | None = None) -> dict:
        self.get_alert(patient_id, alert_id)
        self.alert_repository.resolve(patient_id, alert_id, performed_by, note)
        return self.alert_repository.get(patient_id, alert_id)
