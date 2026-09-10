"""HTTP contract tests. Only test repositories/providers use in-memory fixtures.

These tests exercise real routes, authorization, schemas and services. They do
not claim to verify a live Firebase project, physical microphone, or FCM delivery.
"""

from __future__ import annotations

import datetime as dt
from collections import defaultdict
from unittest.mock import AsyncMock

import numpy as np
import pytest
from fastapi.testclient import TestClient

from app import dependencies
from app.ai.embeddings import EmbeddingEngine
from app.ai.llm_service import LLMService
from app.ai.speech.stt import SpeechToTextService
from app.ai.speech.tts import TextToSpeechService
from app.core.exceptions import AuthenticationError, DatabaseUnavailableError, ExternalServiceError
from app.core.rate_limit import pairing_verify_limiter, voice_upload_limiter
from app.database.repositories.base_repository import SubcollectionRepository
from app.database.repositories.consent_repository import DEFAULT_CONSENT, ConsentRepository
from app.database.repositories.conversation_repository import ConversationEventRepository
from app.database.repositories.device_repository import (
    CaregiverDeviceTokenRepository,
    PairingRepository,
    PatientDeviceRepository,
)
from app.database.repositories.event_repository import DistressEventRepository
from app.database.repositories.family_repository import FamilyRepository
from app.database.repositories.memory_repository import MemoryRepository
from app.database.repositories.patient_repository import PatientRepository
from app.database.repositories.user_repository import UserRepository
from app.main import create_app


@pytest.fixture
def api(monkeypatch):
    patients, consents, codes, devices = {}, {}, {}, set()
    records = defaultdict(dict)

    def create_patient(_self, data):
        pid = f"patient-{len(patients) + 1}"
        patients[pid] = dict(data, id=pid, archived=False)
        return dict(patients[pid])

    def create(_self, pid, data, doc_id=None):
        rows = records[(pid, _self.collection_name)]
        key = doc_id or f"record-{len(rows) + 1}"
        rows[key] = dict(data, id=key, createdAt=dt.datetime.now(dt.UTC))
        return dict(rows[key])

    def rows(_self, pid, **kwargs):
        return list(records[(pid, _self.collection_name)].values())

    def consent_update(_self, pid, value):
        consents.setdefault(pid, dict(DEFAULT_CONSENT)).update(value)
        return consents[pid]

    def verify(token):
        if token not in ("caregiver-token", "other-token", "family-token"):
            raise AuthenticationError("Invalid token")
        return {"uid": token.split("-")[0], "email": None}

    monkeypatch.setattr(dependencies, "verify_firebase_id_token", verify)
    monkeypatch.setattr(
        UserRepository, "get", lambda _, uid: {"role": "family" if uid == "family" else "caregiver"}
    )
    monkeypatch.setattr(
        UserRepository,
        "family_patient_ids",
        lambda _, uid: list(patients) if uid == "family" else [],
    )
    monkeypatch.setattr(PatientRepository, "create", create_patient)
    monkeypatch.setattr(
        PatientRepository, "get", lambda _, pid: dict(patients[pid]) if pid in patients else None
    )
    monkeypatch.setattr(
        PatientRepository, "update", lambda _, pid, data: patients[pid].update(data)
    )
    monkeypatch.setattr(SubcollectionRepository, "create", create)
    monkeypatch.setattr(
        SubcollectionRepository,
        "get",
        lambda self, pid, rid: records[(pid, self.collection_name)].get(rid),
    )
    monkeypatch.setattr(
        SubcollectionRepository,
        "update",
        lambda self, pid, rid, data: records[(pid, self.collection_name)][rid].update(data),
    )
    monkeypatch.setattr(SubcollectionRepository, "list", rows)
    monkeypatch.setattr(
        FamilyRepository,
        "list_patient_visible",
        lambda self, pid: [r for r in rows(self, pid) if r.get("patientVisible")],
    )
    monkeypatch.setattr(
        MemoryRepository,
        "list_patient_visible",
        lambda self, pid: [
            r for r in rows(self, pid) if r.get("approved") and r.get("visibleToPatient")
        ],
    )
    monkeypatch.setattr(
        MemoryRepository,
        "list_ai_usable",
        lambda self, pid: [
            r for r in rows(self, pid) if r.get("approved") and r.get("aiMayKnowInternally")
        ],
    )
    monkeypatch.setattr(
        ConsentRepository, "get", lambda _, pid: consents.get(pid, dict(DEFAULT_CONSENT))
    )
    monkeypatch.setattr(ConsentRepository, "update", consent_update)
    monkeypatch.setattr(EmbeddingEngine, "embed_text", lambda _, text: np.ones(16))
    monkeypatch.setattr(
        PairingRepository,
        "create",
        lambda _, pid, hashed, expiry: (
            codes.update({hashed: {"patientId": pid, "expiresAt": expiry, "used": False}}) or True
        ),
    )

    def consume(_self, hashed):
        row = codes.get(hashed)
        if not row or row["used"] or row["expiresAt"] <= dt.datetime.now(dt.UTC):
            return None
        row["used"] = True
        return row

    monkeypatch.setattr(PairingRepository, "consume", consume)
    monkeypatch.setattr(
        PatientDeviceRepository, "bind", lambda _, pid, did: devices.add((pid, did))
    )
    monkeypatch.setattr(
        PatientDeviceRepository, "is_bound", lambda _, pid, did: (pid, did) in devices
    )
    monkeypatch.setattr(
        ConversationEventRepository,
        "recent_for_conversation",
        lambda self, pid, cid, limit=6: [
            r for r in rows(self, pid) if r.get("conversationId") == cid
        ][-limit:],
    )
    monkeypatch.setattr(DistressEventRepository, "since", lambda self, pid, since: rows(self, pid))
    monkeypatch.setattr(CaregiverDeviceTokenRepository, "list_tokens", lambda _, uid: [])
    monkeypatch.setattr(
        SpeechToTextService, "transcribe", AsyncMock(return_value="I enjoy my garden.")
    )
    monkeypatch.setattr(
        LLMService,
        "generate_patient_response",
        AsyncMock(return_value="We can enjoy a quiet moment together."),
    )
    monkeypatch.setattr(
        TextToSpeechService, "synthesize", AsyncMock(return_value="https://media.test/response.mp3")
    )
    pairing_verify_limiter._attempts.clear()
    voice_upload_limiter._attempts.clear()
    client = TestClient(create_app())
    caregiver = {"Authorization": "Bearer caregiver-token"}
    patient = client.post(
        "/api/v1/patients",
        headers=caregiver,
        json={
            "firstName": "Test Person",
            "preferredName": "Test Preferred",
            "preferredLanguage": "en",
            "stage": "EARLY",
            "routines": ["Open curtains", "Enjoy breakfast"],
        },
    )
    assert patient.status_code == 200, patient.text
    pid = patient.json()["id"]
    pairing = client.post(f"/api/v1/pairing/{pid}/code", headers=caregiver).json()
    session = client.post(
        "/api/v1/pairing/verify",
        json={
            "pairingCode": pairing["pairing_code"],
            "deviceId": "test-device-1",
        },
    )
    assert session.status_code == 200, session.text
    yield dict(
        client=client,
        caregiver=caregiver,
        pid=pid,
        device={"Authorization": "Bearer " + session.json()["accessToken"]},
        records=records,
        patients=patients,
        consents=consents,
        codes=codes,
        devices=devices,
        pairing=pairing,
        session=session.json(),
    )
    client.close()


def add_content(api):
    c, pid, headers = api["client"], api["pid"], api["caregiver"]
    family = c.post(
        f"/api/v1/patients/{pid}/family",
        headers=headers,
        json={
            "name": "Test Relative",
            "relationship": "Sibling",
            "description": "We enjoy our walks.",
            "photoUrl": "https://media.test/family.jpg",
            "voiceRecordingUrl": "https://media.test/voice.mp3",
            "phone": "+15550100000",
            "patientVisible": True,
        },
    )
    assert family.status_code == 200, family.text
    memory = c.post(
        f"/api/v1/patients/{pid}/memories",
        headers=headers,
        json={
            "title": "Test Garden",
            "description": "We cared for the flowers together.",
            "category": "MUSIC",
            "imageUrl": "https://media.test/garden.jpg",
            "audioUrl": "https://media.test/song.mp3",
            "associatedPeople": [family.json()["id"]],
            "approved": True,
            "visibleToPatient": True,
            "displayDate": "A summer afternoon",
        },
    )
    assert memory.status_code == 200, memory.text
    return family.json(), memory.json()


def test_caregiver_to_patient_content_and_results(api):
    family, memory = add_content(api)
    c, pid, device = api["client"], api["pid"], api["device"]
    base = f"/api/v1/patients/{pid}"
    profile = c.get(base, headers=device).json()
    assert profile["preferredName"] == "Test Preferred"
    assert "configuredStage" not in profile
    relatives = c.get(base + "/family", headers=device).json()
    assert relatives[0]["description"] == family["description"]
    assert relatives[0]["voiceMessageUrl"] is None  # voice consent defaults off
    assert (
        c.get(base + "/memories", headers=device).json()[0]["people"][0]["name"] == family["name"]
    )
    assert (
        c.get(base + "/memories/" + memory["id"], headers=device).json()["displayDate"]
        == memory["displayDate"]
    )
    comfort = c.get(base + "/comfort", headers=device).json()
    assert comfort[0]["mediaUrl"] == memory["audioUrl"]
    assert c.get(base + "/recommendation", headers=device).json()["action"]["type"] == "SHOW_MEMORY"
    activities = c.get(base + "/activities/recommended", headers=device).json()
    assert {a["type"] for a in activities} == {
        "family_recognition",
        "life_memory_recall",
        "daily_routine_sequencing",
        "photo_recognition",
        "music_memory",
    }
    activity = next(a for a in activities if a["type"] == "family_recognition")
    path = base + "/activities/" + activity["id"]
    detail = c.get(path, headers=device).json()
    assert detail["imageUrl"] == family["photoUrl"]
    assert "answer" not in detail
    result = c.post(
        path + "/result",
        headers=device,
        json={
            "result": "completed",
            "response": [family["id"]],
            "completionTime": 4.5,
        },
    )
    assert result.status_code == 200, result.text
    assert result.json()["feedback"] == "That’s right."
    assert result.json()["patientId"] == pid
    assert result.json()["timestamp"]
    assert len(api["records"][(pid, "activities")]) == 1


def test_export_patient_response_contracts(api):
    """Capture real route serialization for the TypeScript contract check, when requested."""
    import json
    import os
    from pathlib import Path

    family, memory = add_content(api)
    c, pid, headers = api["client"], api["pid"], api["device"]
    base = f"/api/v1/patients/{pid}"
    paths = {
        "patientSchema": base,
        "familySchema": base + "/family/" + family["id"],
        "memorySchema": base + "/memories/" + memory["id"],
        "settingsSchema": base + "/settings",
        "helpSchema": base + "/help/contacts",
        "recommendationSchema": base + "/recommendation",
        "activityDetailSchema": base + "/activities/family:" + family["id"],
    }
    captured = {}
    for key, path in paths.items():
        response = c.get(path, headers=headers)
        assert response.status_code == 200, response.text
        captured[key] = response.json()
    captured["comfortSchema"] = c.get(base + "/comfort", headers=headers).json()[0]
    captured["activitySchema"] = c.get(base + "/activities/recommended", headers=headers).json()[0]
    captured["pairingSchema"] = api["session"]
    captured["helpResultSchema"] = c.post(base + "/help", headers=headers, json={}).json()
    captured["feedbackSchema"] = c.post(
        paths["activityDetailSchema"] + "/result",
        headers=headers,
        json={"result": "completed", "response": [family["id"]], "completionTime": 2},
    ).json()
    captured["conversationSchema"] = c.post(
        "/api/v1/conversations/voice",
        headers=headers,
        data={"patientId": pid},
        files={"audio": ("voice.webm", b"test-audio", "audio/webm")},
    ).json()
    # Never commit even test JWTs. These fields are opaque credentials to the client.
    captured["pairingSchema"].update(
        accessToken="test-access-token", refreshToken="test-refresh-token"
    )
    if output := os.environ.get("GERICARE_CONTRACT_FIXTURE"):
        target = Path(output)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(json.dumps(captured, indent=2), encoding="utf-8")


def test_song_navigation_tracks_current_approved_music(api):
    _, first = add_content(api)
    _, second = add_content(api)
    base = f"/api/v1/patients/{api['pid']}"
    path = base + "/activities/music:" + first["id"]
    assert (
        api["client"].get(path, headers=api["device"]).json()["nextActivityId"]
        == "music:" + second["id"]
    )
    api["client"].put(
        base + "/memories/" + second["id"], headers=api["caregiver"], json={"approved": False}
    )
    assert api["client"].get(path, headers=api["device"]).json()["nextActivityId"] is None


def test_pairing_cannot_bypass_rate_limit_by_changing_device_id(api):
    for index in range(4):
        response = api["client"].post(
            "/api/v1/pairing/verify",
            json={
                "pairingCode": "ABCDEFGH",
                "deviceId": f"new-device-{index}",
            },
        )
        assert response.status_code != 429
    response = api["client"].post(
        "/api/v1/pairing/verify",
        json={
            "pairingCode": "ABCDEFGH",
            "deviceId": "another-device",
        },
    )
    assert response.status_code == 429


def test_help_notification_failure_reports_saved_alert_without_delivery_claim(api, monkeypatch):
    from app.services.notification_service import NotificationService

    monkeypatch.setattr(NotificationService, "notify_caregiver_of_alert", lambda *args: "failed")
    response = api["client"].post(
        f"/api/v1/patients/{api['pid']}/help", headers=api["device"], json={}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert "has been notified" not in response.json()["message"]
    assert api["records"][(api["pid"], "alerts")]


def test_voice_accepts_browser_codec_content_type(api):
    response = api["client"].post(
        "/api/v1/conversations/voice",
        headers=api["device"],
        data={"patientId": api["pid"]},
        files={"audio": ("voice.webm", b"test-audio", "audio/webm;codecs=opus")},
    )
    assert response.status_code == 200, response.text


def test_biography_recall_requires_current_consent(api):
    base = f"/api/v1/patients/{api['pid']}"
    api["client"].put(base, headers=api["caregiver"], json={"profession": "Test occupation"})
    path = base + "/activities/biography:profession"
    assert "Test occupation" in api["client"].get(path, headers=api["device"]).json()["prompt"]
    api["consents"][api["pid"]]["aiMayUseBiography"] = False
    assert api["client"].get(path, headers=api["device"]).status_code == 404


def test_updates_and_revoked_consent_are_reflected(api):
    family, memory = add_content(api)
    c, pid, device, caregiver = api["client"], api["pid"], api["device"], api["caregiver"]
    base = f"/api/v1/patients/{pid}"
    assert (
        c.put(
            base, headers=caregiver, json={"preferredName": "Updated Name", "stage": "LATE"}
        ).status_code
        == 200
    )
    assert c.get(base, headers=device).json()["preferredName"] == "Updated Name"
    assert (
        c.put(base + "/consent", headers=caregiver, json={"voiceRecordingsUsage": True}).status_code
        == 200
    )
    assert c.get(base + "/family", headers=device).json()[0]["voiceMessageUrl"]
    assert (
        c.get(base + "/recommendation", headers=device).json()["action"]["type"]
        == "PLAY_FAMILY_VOICE"
    )
    activity = c.get(base + "/activities/family:" + family["id"], headers=device).json()
    assert activity["interactionMode"] == "reflection"
    assert activity["options"] == []
    assert (
        c.put(
            base + "/consent",
            headers=caregiver,
            json={"memoriesUsage": False, "photosUsage": False, "voiceRecordingsUsage": False},
        ).status_code
        == 200
    )
    assert c.get(base + "/memories", headers=device).json() == []
    assert c.get(base + "/memories/" + memory["id"], headers=device).status_code == 404
    assert c.get(base + "/comfort", headers=device).json() == []
    assert c.get(base + "/family", headers=device).json()[0]["photoUrl"] is None


def test_hidden_content_never_reaches_patient(api):
    family, memory = add_content(api)
    c, pid = api["client"], api["pid"]
    base = f"/api/v1/patients/{pid}"
    c.put(
        base + "/family/" + family["id"], headers=api["caregiver"], json={"patientVisible": False}
    )
    c.put(base + "/memories/" + memory["id"], headers=api["caregiver"], json={"approved": False})
    assert c.get(base + "/family", headers=api["device"]).json() == []
    assert c.get(base + "/family/" + family["id"], headers=api["device"]).status_code == 404
    assert c.get(base + "/memories", headers=api["device"]).json() == []
    assert (
        c.get(base + "/activities/photo:" + memory["id"], headers=api["device"]).status_code == 404
    )


def test_pairing_is_one_use_and_bound_device_is_required(api):
    c = api["client"]
    replay = c.post(
        "/api/v1/pairing/verify",
        json={"pairingCode": api["pairing"]["pairing_code"], "deviceId": "other-device"},
    )
    assert replay.status_code == 400
    assert (
        c.get("/api/v1/patients/another-patient/family", headers=api["device"]).status_code == 401
    )
    api["devices"].clear()
    assert c.get("/api/v1/patients/" + api["pid"], headers=api["device"]).status_code == 401
    assert (
        c.post(
            "/api/v1/auth/refresh",
            json={"deviceId": "test-device-1", "refreshToken": api["session"]["refreshToken"]},
        ).status_code
        == 401
    )


def test_pairing_expiry_and_caregiver_authorization(api):
    c, pid = api["client"], api["pid"]
    for header in (
        {},
        {"Authorization": "Bearer other-token"},
        {"Authorization": "Bearer family-token"},
    ):
        assert c.post(f"/api/v1/pairing/{pid}/code", headers=header).status_code in (401, 403)
    code = c.post(f"/api/v1/pairing/{pid}/code", headers=api["caregiver"]).json()["pairing_code"]
    for row in api["codes"].values():
        row["expiresAt"] = dt.datetime.now(dt.UTC) - dt.timedelta(seconds=1)
    assert (
        c.post(
            "/api/v1/pairing/verify", json={"pairingCode": code, "deviceId": "new-device"}
        ).status_code
        == 400
    )


def test_invalid_results_and_empty_activity_state(api):
    c, pid, device = api["client"], api["pid"], api["device"]
    base = f"/api/v1/patients/{pid}/activities"
    assert (
        c.post(
            base + "/routine-sequencing/result",
            headers=device,
            json={"result": "completed", "response": ["untrusted"], "completionTime": 1},
        ).status_code
        == 422
    )
    assert (
        c.post(
            base + "/routine-sequencing/result",
            headers=device,
            json={"result": "completed", "response": ["0"], "completionTime": -1},
        ).status_code
        == 422
    )
    assert (
        c.post(
            base + "/unknown/result",
            headers=device,
            json={"result": "skipped", "response": [], "completionTime": 1},
        ).status_code
        == 404
    )
    api["patients"][pid]["routines"] = []
    assert c.get(base + "/recommended", headers=device).json() == []


def test_help_stores_event_and_alert_with_no_fabricated_distress(api):
    c, pid = api["client"], api["pid"]
    response = c.post(f"/api/v1/patients/{pid}/help", headers=api["device"], json={})
    assert response.status_code == 200, response.text
    assert response.json()["success"] is True
    events = list(api["records"][(pid, "conversation_events")].values())
    assert events[0]["distressScore"] is None
    assert events[0]["intent"] == "help_request"
    alerts = list(api["records"][(pid, "alerts")].values())
    assert len(alerts) == 1 and alerts[0]["eventId"] == events[0]["id"]


def test_help_failure_does_not_confirm_success(api, monkeypatch):
    from app.services.alert_service import AlertService

    def fail(*args, **kwargs):
        raise DatabaseUnavailableError("Storage unavailable")

    monkeypatch.setattr(AlertService, "create_alert", fail)
    response = api["client"].post(
        f"/api/v1/patients/{api['pid']}/help", headers=api["device"], json={}
    )
    assert response.status_code == 503
    assert "success" not in response.json()


def test_settings_and_emergency_configuration(api):
    c, pid, device = api["client"], api["pid"], api["device"]
    base = f"/api/v1/patients/{pid}"
    values = {
        "textSize": "extra-large",
        "reducedMotion": True,
        "voiceVolume": 0.5,
        "replayVoiceResponse": False,
    }
    assert c.put(base + "/settings", headers=device, json=values).json() == values
    assert c.get(base + "/settings", headers=device).json() == values
    assert (
        c.put(base + "/settings", headers=device, json=dict(values, voiceVolume=2)).status_code
        == 422
    )
    assert c.get(base + "/help/contacts", headers=device).json()["emergencyPhone"] is None
    c.put(base, headers=api["caregiver"], json={"emergencyServicesPhone": "+15550100111"})
    assert c.get(base + "/help/contacts", headers=device).json()["emergencyPhone"] == "+15550100111"


def test_voice_runs_pipeline_and_returns_server_audio(api):
    response = api["client"].post(
        "/api/v1/conversations/voice",
        headers=api["device"],
        data={"patientId": api["pid"]},
        files={"audio": ("recording.webm", b"test-audio", "audio/webm")},
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["responseAudioUrl"] == "https://media.test/response.mp3"
    assert body["transcript"] == "I enjoy my garden."
    assert set(body) == {
        "conversationId",
        "transcript",
        "responseText",
        "responseAudioUrl",
        "status",
        "uiMode",
        "actions",
    }
    SpeechToTextService.transcribe.assert_awaited_once()
    TextToSpeechService.synthesize.assert_awaited_once()


@pytest.mark.parametrize("provider", ["stt", "llm", "tts"])
def test_voice_provider_failures_are_explicit(api, monkeypatch, provider):
    from app.core.exceptions import LLMServiceError, SpeechRecognitionError

    if provider == "stt":
        monkeypatch.setattr(
            SpeechToTextService,
            "transcribe",
            AsyncMock(side_effect=SpeechRecognitionError("No speech")),
        )
    elif provider == "llm":
        monkeypatch.setattr(
            LLMService,
            "generate_patient_response",
            AsyncMock(side_effect=LLMServiceError("Unavailable")),
        )
    else:
        monkeypatch.setattr(
            TextToSpeechService,
            "synthesize",
            AsyncMock(side_effect=ExternalServiceError("Unavailable")),
        )
    response = api["client"].post(
        "/api/v1/conversations/voice",
        headers=api["device"],
        data={"patientId": api["pid"]},
        files={"audio": ("recording.webm", b"test-audio", "audio/webm")},
    )
    assert response.status_code == {"stt": 422, "llm": 502, "tts": 200}[provider]
    if provider == "tts":
        assert response.json()["status"] == "tts_unavailable"
        assert response.json()["responseAudioUrl"] is None


def test_consent_blocks_voice_before_transcription(api):
    api["consents"][api["pid"]]["aiConversationEnabled"] = False
    response = api["client"].post(
        "/api/v1/conversations/voice",
        headers=api["device"],
        data={"patientId": api["pid"]},
        files={"audio": ("recording.webm", b"test-audio", "audio/webm")},
    )
    assert response.json()["status"] == "ai_disabled"
    SpeechToTextService.transcribe.assert_not_awaited()
