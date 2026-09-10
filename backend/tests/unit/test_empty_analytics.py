from unittest.mock import Mock

from app.schemas.analytics import DistressAnalyticsResponse, PatternAnalyticsResponse
from app.schemas.patient import PatientLiveStatusResponse
from app.services.analytics_service import AnalyticsService
from app.services.conversation_service import ConversationService
from app.utils.datetime import utcnow


def test_no_observations_do_not_create_a_distress_score_or_chart():
    repository = Mock()
    repository.since.return_value = []
    repository.list.return_value = []
    service = AnalyticsService(
        repetition_repository=repository,
        distress_repository=repository,
        conversation_event_repository=repository,
    )
    distress = DistressAnalyticsResponse(**service.distress_analytics("test-patient"))
    assert distress.currentDistressScore is None
    assert distress.riskLevel is None
    pattern = PatternAnalyticsResponse(**service.pattern_analytics("test-patient"))
    assert pattern.hourlyPatterns == []


def test_help_event_with_no_distress_measurement_has_valid_live_status():
    events, patients = Mock(), Mock()
    events.recent_for_patient.return_value = [
        {
            "createdAt": utcnow(),
            "intent": "request_help",
            "distressScore": None,
        }
    ]
    patients.get.return_value = {"configuredStage": "EARLY"}
    service = ConversationService(conversation_event_repository=events, patient_repository=patients)
    status = PatientLiveStatusResponse(**service.get_live_status("test-patient"))
    assert status.distressScore is None
