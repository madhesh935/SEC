"""Firebase Cloud Messaging integration for caregiver alerts.

Notification payloads deliberately avoid sensitive detail on the lock screen
(spec section 45) - detail is only visible after authenticated app/site
access.
"""

from __future__ import annotations

from firebase_admin import messaging

from app.core.logging import get_logger
from app.database.repositories.device_repository import CaregiverDeviceTokenRepository

logger = get_logger(__name__)


class NotificationService:
    def __init__(self, token_repository: CaregiverDeviceTokenRepository | None = None) -> None:
        self.token_repository = token_repository or CaregiverDeviceTokenRepository()

    def register_device_token(self, user_id: str, token: str) -> None:
        self.token_repository.register(user_id, token)

    def notify_caregiver_of_alert(self, caregiver_uid: str, alert_id: str, patient_id: str) -> None:
        tokens = self.token_repository.list_tokens(caregiver_uid)
        if not tokens:
            logger.info("no_fcm_tokens_for_caregiver", caregiver_uid=caregiver_uid)
            return

        for token in tokens:
            message = messaging.Message(
                notification=messaging.Notification(
                    title="GeriCare AI",
                    body="GeriCare needs your attention for a patient.",
                ),
                data={"alertId": alert_id, "patientId": patient_id, "type": "alert"},
                token=token,
            )
            try:
                messaging.send(message)
            except Exception as exc:  # firebase_admin raises several FCM-specific errors
                logger.warning("fcm_send_failed", error=str(exc))
