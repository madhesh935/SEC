from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from app.services import patient_content_service as module


@pytest.fixture
def content(monkeypatch):
    monkeypatch.setattr(
        module, "get_settings", lambda: SimpleNamespace(firebase_storage_bucket="test-bucket")
    )
    signer = Mock(return_value="https://test-media.test/renewed")
    monkeypatch.setattr(module, "signed_url", signer)
    service = module.PatientContentService(
        {"id": "patient-one", "primaryCaregiverId": "caregiver-one"},
        consent_service=SimpleNamespace(get_consent=lambda pid: {}),
    )
    return service, signer


@pytest.mark.parametrize(
    "url",
    [
        "https://storage.googleapis.com/test-bucket/patients/patient-one/photo/a.jpg?expired=1",
        "https://firebasestorage.googleapis.com/v0/b/test-bucket/o/patients%2Fpatient-one%2Fphoto%2Fa.jpg?token=old",
        "https://test-bucket.storage.googleapis.com/patients/patient-one/photo/a.jpg",
    ],
)
def test_uploaded_media_url_is_renewed_from_authorized_path(content, url):
    service, signer = content
    assert service.media_url(url) == "https://test-media.test/renewed"
    signer.assert_called_once_with("patients/patient-one/photo/a.jpg", expires_minutes=120)


@pytest.mark.parametrize(
    "url",
    [
        "https://storage.googleapis.com/test-bucket/patients/other/photo/a.jpg",
        "https://storage.googleapis.com/test-bucket/patients/patient-one/../other/a.jpg",
        "file:///private/photo.jpg",
    ],
)
def test_unapproved_path_is_never_signed(content, url):
    service, signer = content
    assert service.media_url(url) is None
    signer.assert_not_called()
