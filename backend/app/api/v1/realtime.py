"""Caregiver dashboard realtime updates (spec section 56).

Implemented as Server-Sent Events polling the live-status projection. The
polling implementation is intentionally isolated behind this single endpoint
so the transport can be swapped for a native Firestore listener or WebSocket
later without changing the caregiver-facing contract.
"""

from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Depends, Query, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

from app.core.exceptions import AuthenticationError, GeriCareError
from app.core.permissions import require_caregiver_role, require_patient_access
from app.core.security import verify_firebase_id_token
from app.dependencies import (
    authorize_patient_access,
    get_patient_repository,
    get_user_repository,
)
from app.models.enums import UserRole
from app.services.alert_service import AlertService
from app.services.conversation_service import ConversationService

router = APIRouter(prefix="/patients/{patient_id}/realtime", tags=["Realtime"])
live_ws_router = APIRouter(prefix="/patients/{patient_id}", tags=["Realtime"])
alerts_ws_router = APIRouter(tags=["Realtime"])

_WS_POLL_INTERVAL_SECONDS = 2.0


def _authenticate_ws_user(token: str):
    from app.core.security import AuthenticatedUser

    decoded = verify_firebase_id_token(token)
    uid = decoded["uid"]
    user_repo = get_user_repository()
    user_doc = user_repo.get(uid)
    role = user_doc.get("role") if user_doc else None
    if role not in (UserRole.CAREGIVER, UserRole.FAMILY, UserRole.ADMIN):
        raise AuthenticationError("No authorized role is assigned to this account yet.")
    user = AuthenticatedUser(uid=uid, email=decoded.get("email"), role=role)
    require_caregiver_role(user)
    return user


_POLL_INTERVAL_SECONDS = 2.0
_MAX_STREAM_SECONDS = 300


async def _event_stream(patient_id: str, token: str):
    service = ConversationService()
    last_payload: str | None = None
    elapsed = 0.0

    while elapsed < _MAX_STREAM_SECONDS:
        try:
            user = _authenticate_ws_user(token)
            require_patient_access(user, get_patient_repository().get(patient_id), [])
        except GeriCareError:
            return
        status = service.get_live_status(patient_id)
        payload = json.dumps(status)
        if payload != last_payload:
            yield f"event: interaction_processed\ndata: {payload}\n\n"
            last_payload = payload
        await asyncio.sleep(_POLL_INTERVAL_SECONDS)
        elapsed += _POLL_INTERVAL_SECONDS

    yield "event: stream_timeout\ndata: {}\n\n"


@router.get("")
async def realtime_updates(
    request: Request, patient: dict = Depends(authorize_patient_access)
) -> StreamingResponse:
    token = request.headers.get("authorization", "").removeprefix("Bearer ")
    return StreamingResponse(_event_stream(patient["id"], token), media_type="text/event-stream")


@live_ws_router.websocket("/live-ws")
async def live_status_ws(websocket: WebSocket, patient_id: str, token: str = Query(...)) -> None:
    """Native WebSocket counterpart to GET .../realtime (SSE), matching the
    caregiver website's realtimeService.subscribeToLiveStatus contract.
    Browsers can't send custom headers on a WebSocket handshake, so the
    Firebase ID token travels as a query parameter instead of a Bearer
    header - callers must treat this URL as sensitive and avoid logging it.
    """
    try:
        user = _authenticate_ws_user(token)
        patient_repo = get_patient_repository()
        user_repo = get_user_repository()
        patient = patient_repo.get(patient_id)
        require_patient_access(user, patient, user_repo.family_patient_ids(user.uid))
    except GeriCareError:
        await websocket.close(code=4401)
        return

    await websocket.accept()
    service = ConversationService()
    last_payload: str | None = None
    try:
        while True:
            user = _authenticate_ws_user(token)
            require_patient_access(user, patient_repo.get(patient_id), [])
            status = service.get_live_status(patient_id)
            payload = json.dumps(status)
            if payload != last_payload:
                await websocket.send_json(status)
                last_payload = payload
            await asyncio.sleep(_WS_POLL_INTERVAL_SECONDS)
    except WebSocketDisconnect:
        pass
    except GeriCareError:
        await websocket.close(code=4403)


@alerts_ws_router.websocket("/alerts-ws")
async def alerts_ws(websocket: WebSocket, token: str = Query(...)) -> None:
    """Streams newly created alerts across every patient the caller can
    access, matching realtimeService.subscribeToAlerts."""
    try:
        user = _authenticate_ws_user(token)
    except GeriCareError:
        await websocket.close(code=4401)
        return

    await websocket.accept()
    patient_repo = get_patient_repository()
    alert_service = AlertService()

    def _authorized_patient_ids() -> list[str]:
        return list({p["id"] for p in patient_repo.list_for_caregiver(user.uid)})

    # Baseline: don't flood a freshly connected client with alert history -
    # only stream alerts created after the socket opened.
    seen_ids: set[str] = {
        a["id"] for a in alert_service.list_alerts(_authorized_patient_ids(), status=None)
    }

    try:
        while True:
            user = _authenticate_ws_user(token)
            alerts = alert_service.list_alerts(_authorized_patient_ids(), status=None)
            for alert in alerts:
                if alert["id"] not in seen_ids:
                    seen_ids.add(alert["id"])
                    await websocket.send_json(alert)
            await asyncio.sleep(_WS_POLL_INTERVAL_SECONDS)
    except WebSocketDisconnect:
        pass
    except GeriCareError:
        await websocket.close(code=4403)
