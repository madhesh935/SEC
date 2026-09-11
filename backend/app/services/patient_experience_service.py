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
        from datetime import datetime

        hour = datetime.now().hour
        memories = content.memories()
        voices = [member for member in content.family() if member.voiceMessageUrl]

        # 1. Late afternoon / Evening / Night (sundowning reassurance: 16:00 - 23:59 or early morning 00:00 - 05:59)
        if hour >= 16 or hour < 6:
            # Primary: Reassuring family voice (e.g. Sarah)
            sarah = next((m for m in voices if "sarah" in m.name.lower()), None)
            target_voice = sarah or (voices[0] if voices else None)
            if target_voice:
                return HomeRecommendation(
                    title="A comforting message from Sarah",
                    subtitle="Your daughter Sarah left a gentle voice message for you",
                    imageUrl=target_voice.photoUrl or "/static/media/images/family_sarah.jpg",
                    audioUrl=target_voice.voiceMessageUrl or "/static/media/audio/sarah_voice.wav",
                    action=PatientAction(
                        type="PLAY_FAMILY_VOICE",
                        label=f"Hear {target_voice.name.split()[0]}’s Voice",
                        resourceId=target_voice.id,
                        imageUrl=target_voice.photoUrl,
                        audioUrl=target_voice.voiceMessageUrl,
                    ),
                )
            # Secondary: Soothing piano music
            piano = next((m for m in memories if "piano" in m.title.lower() or "clair" in m.title.lower()), None)
            if piano:
                return HomeRecommendation(
                    title="Evening Comfort: Gentle Piano",
                    subtitle="Calming classical piano to help you relax tonight",
                    imageUrl=piano.imageUrl or "/static/media/images/piano.jpg",
                    audioUrl=piano.audioUrl or "/static/media/audio/clair_de_lune.wav",
                    action=PatientAction(
                        type="PLAY_COMFORT_AUDIO",
                        label="Play Gentle Piano",
                        resourceId=piano.id,
                        imageUrl=piano.imageUrl,
                        audioUrl=piano.audioUrl,
                    ),
                )

        # 2. Morning (06:00 - 11:59): Uplifting garden ambience or loved one
        elif 6 <= hour < 12:
            garden = next((m for m in memories if "garden" in m.title.lower() or "bird" in m.title.lower()), None)
            if garden:
                return HomeRecommendation(
                    title="Morning Serenity: Garden Birdsong",
                    subtitle="Gentle morning birdsong and English rose breeze",
                    imageUrl=garden.imageUrl or "/static/media/images/family_sarah.jpg",
                    audioUrl=garden.audioUrl or "/static/media/audio/garden_birdsong.wav",
                    action=PatientAction(
                        type="PLAY_COMFORT_AUDIO",
                        label="Play Garden Birdsong",
                        resourceId=garden.id,
                        imageUrl=garden.imageUrl,
                        audioUrl=garden.audioUrl,
                    ),
                )

        # 3. Afternoon (12:00 - 15:59): Cherished life memories
        cornwall = next((m for m in memories if "cornwall" in m.title.lower() or "holiday" in m.title.lower() or "sea" in m.title.lower()), None)
        if cornwall:
            return HomeRecommendation(
                title="Cherished Memory: Cornwall Seaside",
                subtitle="Summer holidays with warm sunshine and ocean waves",
                imageUrl=cornwall.imageUrl or "/static/media/images/cornwall.jpg",
                audioUrl=cornwall.audioUrl or "/static/media/audio/cornwall_waves.wav",
                action=PatientAction(
                    type="SHOW_MEMORY",
                    label="See Cornwall Memory",
                    resourceId=cornwall.id,
                    imageUrl=cornwall.imageUrl,
                    audioUrl=cornwall.audioUrl,
                ),
            )

        # General fallbacks with rich context
        if voices:
            member = voices[0]
            return HomeRecommendation(
                title=f"A message from {member.name}",
                subtitle=member.relationship or "Family Voice",
                imageUrl=member.photoUrl or "/static/media/images/family_sarah.jpg",
                audioUrl=member.voiceMessageUrl or "/static/media/audio/sarah_voice.wav",
                action=PatientAction(
                    type="PLAY_FAMILY_VOICE",
                    label=f"Hear {member.name}’s Voice",
                    resourceId=member.id,
                    imageUrl=member.photoUrl,
                    audioUrl=member.voiceMessageUrl,
                ),
            )
        if memories:
            memory = memories[0]
            return HomeRecommendation(
                title=memory.title,
                subtitle="A special moment to cherish",
                imageUrl=memory.imageUrl or "/static/media/images/cornwall.jpg",
                audioUrl=memory.audioUrl,
                action=PatientAction(
                    type="SHOW_MEMORY",
                    label="See Memory",
                    resourceId=memory.id,
                    imageUrl=memory.imageUrl,
                    audioUrl=memory.audioUrl,
                ),
            )
        return None
