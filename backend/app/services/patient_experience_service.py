from app.database.repositories.patient_repository import PatientRepository
from app.schemas.patient_experience import HomeRecommendation, PatientAction, PatientSettings
from app.services.patient_content_service import PatientContentService


class PatientExperienceService:
    def __init__(self, repository=None):
        self.repository = repository or PatientRepository()

    def settings(self, patient: dict) -> PatientSettings:
        return PatientSettings(**patient.get("patientSettings", {}))

    def save_settings(self, patient: dict, settings: PatientSettings) -> PatientSettings:
        self.repository.update(patient["id"], {"patientSettings": settings.model_dump()})
        return settings

    def recommendation(self, patient: dict) -> HomeRecommendation | None:
        content = PatientContentService(patient)
        voices = [member for member in content.family() if member.voiceMessageUrl]
        if voices:
            return HomeRecommendation(
                title="A familiar voice is waiting",
                action=PatientAction(
                    type="PLAY_FAMILY_VOICE", label="Hear Family Voice", resourceId=voices[0].id
                ),
            )
        memories = content.memories()
        if memories:
            return HomeRecommendation(
                title="A memory you may enjoy",
                action=PatientAction(
                    type="SHOW_MEMORY", label="See Memory", resourceId=memories[0].id
                ),
            )
        return None
