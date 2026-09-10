"""Security/audit event logging for sensitive actions (spec section 59).

Audit entries never include passwords, tokens, API keys, or full request
bodies - only the action, actor, and minimal identifying context.
"""

from __future__ import annotations

from app.core.logging import get_logger

_audit_logger = get_logger("audit")


def audit_log(action: str, actor_uid: str, patient_id: str | None = None, **details: object) -> None:
    _audit_logger.info("audit_event", action=action, actor_uid=actor_uid, patient_id=patient_id, **details)
