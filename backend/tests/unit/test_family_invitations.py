"""Invitation transaction tests; all records are isolated test fixtures."""

import datetime as dt
from types import SimpleNamespace

import pytest

from app.core.exceptions import AuthorizationError
from app.database.repositories import portal_repository as module


@pytest.fixture
def invitation_store(monkeypatch):
    rows = {
        "family_invitations/hashed": {
            "patientId": "patient-a",
            "issuer": "caregiver-a",
            "email": "invited@example.test",
            "relationship": "Relative",
            "permissions": ["viewProfile"],
            "used": False,
            "expiresAt": dt.datetime.now(dt.UTC) + dt.timedelta(hours=1),
        },
        "patients/patient-a": {"primaryCaregiverId": "caregiver-a", "archived": False},
    }

    class Ref:
        def __init__(self, path):
            self.path = path

        def document(self, name):
            return Ref(self.path + "/" + name)

        def collection(self, name):
            return Ref(self.path + "/" + name)

        def get(self, transaction=None):
            return SimpleNamespace(
                exists=self.path in rows,
                id=self.path.split("/")[-1],
                to_dict=lambda: dict(rows[self.path]),
            )

    class Transaction:
        def set(self, ref, data, merge=False):
            if not merge:
                rows[ref.path] = {}
            rows.setdefault(ref.path, {}).update(data)

        def update(self, ref, data):
            rows[ref.path].update(data)

    monkeypatch.setattr(module.firestore, "transactional", lambda fn: fn)
    monkeypatch.setattr(
        module,
        "db",
        lambda: SimpleNamespace(collection=lambda name: Ref(name), transaction=Transaction),
    )
    monkeypatch.setattr(module, "users_collection", lambda: Ref("users"))
    monkeypatch.setattr(module, "patient_doc", lambda pid: Ref("patients/" + pid))
    return rows


def test_invitation_is_email_bound_one_time_and_creates_specific_grant(invitation_store):
    repo = module.InvitationRepository()
    with pytest.raises(AuthorizationError):
        repo.accept("hashed", "family-user", "someone-else@example.test")
    grant = repo.accept("hashed", "family-user", "invited@example.test")
    assert grant["patientId"] == "patient-a" and grant["userId"] == "family-user"
    assert invitation_store["users/family-user"]["role"] == "family"
    assert "patients/patient-a/family_access/family-user" in invitation_store
    assert invitation_store["family_invitations/hashed"]["used"] is True
    with pytest.raises(AuthorizationError):
        repo.accept("hashed", "family-user", "invited@example.test")


@pytest.mark.parametrize("case", ["expired", "archived", "issuer_changed", "caregiver_account"])
def test_invalid_invitation_does_not_write_access(invitation_store, case):
    if case == "expired":
        invitation_store["family_invitations/hashed"]["expiresAt"] = dt.datetime(
            2000, 1, 1, tzinfo=dt.UTC
        )
    if case == "archived":
        invitation_store["patients/patient-a"]["archived"] = True
    if case == "issuer_changed":
        invitation_store["patients/patient-a"]["primaryCaregiverId"] = "another-caregiver"
    if case == "caregiver_account":
        invitation_store["users/family-user"] = {"role": "caregiver"}
    with pytest.raises(AuthorizationError):
        module.InvitationRepository().accept("hashed", "family-user", "invited@example.test")
    assert "patients/patient-a/family_access/family-user" not in invitation_store
    assert invitation_store["family_invitations/hashed"]["used"] is False
