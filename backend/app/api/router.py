"""Central API router - all v1 routers are mounted here (spec section 67)."""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1 import (
    activities,
    alerts,
    analytics,
    auth,
    comfort,
    consent,
    conversations,
    family,
    media,
    memories,
    pairing,
    patient_experience,
    patients,
    realtime,
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(pairing.router)
api_router.include_router(patients.router)
api_router.include_router(patient_experience.router)
api_router.include_router(family.router)
api_router.include_router(memories.router)
api_router.include_router(consent.router)
api_router.include_router(conversations.router)
api_router.include_router(conversations.help_router)
api_router.include_router(comfort.router)
api_router.include_router(activities.router)
api_router.include_router(activities.family_prompt_router)
api_router.include_router(analytics.router)
api_router.include_router(alerts.router)
api_router.include_router(media.router)
api_router.include_router(realtime.router)
api_router.include_router(realtime.live_ws_router)
api_router.include_router(realtime.alerts_ws_router)
