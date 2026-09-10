from __future__ import annotations

import datetime as dt

from firebase_admin import auth as firebase_auth

from app.database.repositories.activity_repository import ActivityRepository
from app.database.repositories.alert_repository import AlertRepository
from app.database.repositories.conversation_repository import ConversationEventRepository
from app.database.repositories.device_repository import PatientDeviceRepository
from app.database.repositories.event_repository import RepetitionEventRepository
from app.database.repositories.patient_repository import PatientRepository
from app.database.repositories.user_repository import UserRepository
from app.schemas.portal import (
    DashboardSummary,
    DeviceRecord,
    ManagedActivity,
    UnifiedActivityEvent,
    UserPreferences,
    UserProfileUpdate,
)
from app.services.activity_service import ActivityService
from app.services.conversation_service import ConversationService
from app.utils.datetime import utcnow

ACTIVITY_NAMES = {
    "family_recognition": "Card Match: Loved Ones",
    "photo_recognition": "Card Match: Cherished Places",
    "daily_routine_sequencing": "Pattern Finding: Day Schedule",
    "life_memory_recall": "Cognitive Exercise: Reminisce",
    "music_memory": "Cognitive Game: Melody Match",
}


class PortalService:
    def preferences(self, uid):
        return UserPreferences(**(UserRepository().get(uid) or {}).get("preferences", {}))

    def save_preferences(self, uid, payload):
        UserRepository().upsert(uid, {"preferences": payload.model_dump()})
        return payload

    def save_profile(self, uid, payload: UserProfileUpdate):
        firebase_auth.update_user(uid, display_name=payload.name)
        UserRepository().upsert(uid, {"name": payload.name})
        return payload

    def devices(self, patient):
        result = []
        for row in PatientDeviceRepository().list(patient["id"]):
            seen = row.get("lastSeenAt")
            bound = row.get("boundAt")
            result.append(
                DeviceRecord(
                    deviceId=row.get("deviceId", row["id"]),
                    active=bool(row.get("active")),
                    connected=bool(
                        row.get("active")
                        and hasattr(seen, "timestamp")
                        and seen.timestamp() > (utcnow() - dt.timedelta(minutes=2)).timestamp()
                    ),
                    boundAt=bound.isoformat() if hasattr(bound, "isoformat") else None,
                    lastSeenAt=seen.isoformat() if hasattr(seen, "isoformat") else None,
                )
            )
        return result

    def dashboard(self, patient):
        pid = patient["id"]
        start = utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        events = ConversationEventRepository().list(pid, limit=500)
        today = [
            e
            for e in events
            if hasattr(e.get("createdAt"), "timestamp") and e["createdAt"] >= start
        ]
        repetitions = RepetitionEventRepository().since(pid, start)
        status = ConversationService().get_patient_status(pid)
        alerts = AlertRepository().list(pid, limit=500)
        devices = self.devices(patient)
        return DashboardSummary(
            currentState=status.get("currentState"),
            conversationsToday=len({e["conversationId"] for e in today if e.get("conversationId")}),
            repeatedTopics=len({e.get("topic") for e in repetitions if e.get("topic")}),
            activeAlerts=sum(1 for a in alerts if a.get("status") == "ACTIVE"),
            connected=any(d.connected for d in devices),
            lastActive=max(
                (
                    e["createdAt"].isoformat()
                    for e in events
                    if hasattr(e.get("createdAt"), "isoformat")
                ),
                default=None,
            ),
            biographySummary=patient.get("biographySummary"),
        )

    def activities(self, patient):
        source = ActivityService(dict(patient, activityPreferences={})).challenges()
        results = ActivityRepository().list(patient["id"], limit=200)
        configured = patient.get("activityPreferences", {})
        output = []
        for kind, title in ACTIVITY_NAMES.items():
            rows = [r for r in source if r["type"] == kind]
            ids = {r["id"] for r in rows}
            history = [r for r in results if r.get("activityId") in ids]
            times = [r.get("timestamp") for r in history if r.get("timestamp")]
            output.append(
                ManagedActivity(
                    type=kind,
                    title=title,
                    enabled=configured.get(kind, True),
                    availableCount=len(rows),
                    completionCount=sum(
                        1 for r in history if r.get("result") in ("completed", "liked")
                    ),
                    lastPlayed=max(times) if times else None,
                )
            )
        return output

    def configure_activity(self, patient, payload):
        prefs = dict(patient.get("activityPreferences", {}))
        prefs[payload.type] = payload.enabled
        PatientRepository().update(patient["id"], {"activityPreferences": prefs})
        return payload

    def unified_activity(self, patient, limit: int = 10) -> list[UnifiedActivityEvent]:
        pid = patient["id"]
        results: list[UnifiedActivityEvent] = []

        conv_events = ConversationEventRepository().list(pid, limit=limit)
        for e in conv_events:
            created_at = e.get("createdAt")
            ts = (
                created_at.isoformat()
                if hasattr(created_at, "isoformat")
                else str(created_at or "")
            )
            transcript = e.get("transcript")
            intent = e.get("intent")
            desc = (
                transcript
                if transcript
                else (f"Topic: {intent}" if intent else "Spoke with companion")
            )
            results.append(
                UnifiedActivityEvent(
                    id=e.get("id") or f"conv-{ts}",
                    type="conversation",
                    title="Talked with Companion",
                    description=desc,
                    timestamp=ts,
                    icon="Bot",
                )
            )

        act_results = ActivityRepository().list(pid, limit=limit)
        for a in act_results:
            if a.get("activityId"):
                ts = str(a.get("timestamp", ""))
                act_title = ACTIVITY_NAMES.get(a.get("type", ""), a.get("activityId", "Activity"))
                results.append(
                    UnifiedActivityEvent(
                        id=a.get("id") or f"act-{a.get('activityId')}-{ts}",
                        type="activity",
                        title=f"Completed Cognitive Activity: {act_title}",
                        description=f"Result: {a.get('result', 'completed')}",
                        timestamp=ts,
                        icon="Brain",
                    )
                )

        alerts = AlertRepository().list(pid, limit=limit)
        for al in alerts:
            created_at = al.get("createdAt")
            ts = (
                created_at.isoformat()
                if hasattr(created_at, "isoformat")
                else str(created_at or "")
            )
            results.append(
                UnifiedActivityEvent(
                    id=al.get("id") or f"alert-{ts}",
                    type="alert",
                    title=al.get("reason", "Caregiver Alert"),
                    description=al.get("contextSummary") or al.get("reason"),
                    timestamp=ts,
                    severity=al.get("severity"),
                    icon="Bell",
                )
            )

        results.sort(key=lambda item: item.timestamp or "", reverse=True)
        return results[:limit]
