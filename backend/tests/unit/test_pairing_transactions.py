"""Exercise transaction bodies, including expiry and collision protection, without Firebase."""

import datetime as dt
from types import SimpleNamespace

import pytest

from app.database.repositories import device_repository as repository


@pytest.fixture
def transaction_store(monkeypatch):
    values = {}

    class Reference:
        def get(self, transaction):
            return SimpleNamespace(
                exists=bool(values), id="code-hash", to_dict=lambda: dict(values)
            )

    class Transaction:
        def set(self, ref, data):
            values.clear()
            values.update(data)

        def update(self, ref, data):
            values.update(data)

    monkeypatch.setattr(repository.firestore, "transactional", lambda fn: fn)
    monkeypatch.setattr(repository, "db", lambda: SimpleNamespace(transaction=Transaction))
    return Reference(), values


def test_live_code_cannot_be_overwritten_and_can_only_be_consumed_once(transaction_store):
    ref, values = transaction_store
    expiry = dt.datetime.now(dt.UTC) + dt.timedelta(minutes=5)
    assert repository.reserve_token(ref, "patient-one", expiry)
    assert not repository.reserve_token(ref, "patient-two", expiry)
    assert values["patientId"] == "patient-one"
    assert repository.consume_token(ref)["patientId"] == "patient-one"
    assert repository.consume_token(ref) is None
    assert repository.reserve_token(ref, "patient-two", expiry)


@pytest.mark.parametrize("expiry", [None, dt.datetime(2000, 1, 1, tzinfo=dt.UTC)])
def test_missing_or_expired_timestamp_never_pairs(transaction_store, expiry):
    ref, values = transaction_store
    values.update(patientId="patient-one", used=False, expiresAt=expiry)
    assert repository.consume_token(ref) is None
    assert values["used"] is False
