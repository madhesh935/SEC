"""Deterministic challenges from currently permitted caregiver content; no invented facts."""

from __future__ import annotations

from app.ai.stage_engine import get_stage_policy
from app.core.exceptions import ResourceNotFoundError, ValidationError
from app.database.repositories.activity_repository import ActivityRepository
from app.models.enums import DementiaStage
from app.schemas.patient_experience import ActivityDetail, ActivityFeedback, ActivitySubmission
from app.services.patient_content_service import PatientContentService
from app.utils.datetime import utcnow


class ActivityService:
    def __init__(self, patient: dict, content=None, repository=None):
        self.patient = patient
        self.content = content or PatientContentService(patient)
        self.repository = repository or ActivityRepository()

    def challenges(self) -> list[dict]:
        policy = get_stage_policy(DementiaStage(self.patient["configuredStage"]))
        if not self.content.consent.get("personalDataCollection", True):
            return []
        family, memories = self.content.family(), self.content.memories()
        difficulty = "supported" if policy.avoidMemoryTesting else "gentle"
        result = []
        for member in family:
            if not member.photoUrl:
                continue
            result.append(
                dict(
                    id=f"family:{member.id}",
                    type="family_recognition",
                    title="Card Match: Loved Ones",
                    description="Card matching game with familiar faces & names",
                    prompt=(
                        f"This is {member.name}, your {member.relationship}."
                        if policy.avoidMemoryTesting
                        else "Who is in this photo?"
                    ),
                    interactionMode="reflection" if policy.avoidMemoryTesting else "choice",
                    imageUrl=member.photoUrl,
                    options=[]
                    if policy.avoidMemoryTesting
                    else [dict(id=p.id, label=p.name) for p in family[:4] if p.id != member.id]
                    + [dict(id=member.id, label=member.name)],
                    answer=[member.id],
                    explanation=f"This is {member.name}"
                    + (f", your {member.relationship}." if member.relationship else "."),
                )
            )
        for memory in memories:
            if policy.allowMemoryPrompt and memory.description:
                result.append(
                    dict(
                        id=f"recall:{memory.id}",
                        type="life_memory_recall",
                        title="Cognitive Exercise: Reminisce",
                        description=memory.title,
                        prompt=memory.description,
                        interactionMode="reflection",
                        imageUrl=memory.imageUrl,
                        explanation="Thank you for sharing this moment.",
                    )
                )
            if memory.imageUrl:
                result.append(
                    dict(
                        id=f"photo:{memory.id}",
                        type="photo_recognition",
                        title="Card Match: Cherished Places",
                        description="Match the cards to familiar photos and memories",
                        imageUrl=memory.imageUrl,
                        prompt=memory.title
                        if policy.avoidMemoryTesting
                        else "Which moment is this?",
                        interactionMode="reflection" if policy.avoidMemoryTesting else "choice",
                        options=[]
                        if policy.avoidMemoryTesting
                        else [
                            dict(id=m.id, label=m.title) for m in memories[:3] if m.id != memory.id
                        ]
                        + [dict(id=memory.id, label=memory.title)],
                        answer=[memory.id],
                        explanation=f"This is {memory.title}.",
                    )
                )
            if memory.category == "MUSIC" and memory.audioUrl:
                result.append(
                    dict(
                        id=f"music:{memory.id}",
                        type="music_memory",
                        title="Cognitive Game: Melody Match",
                        description=memory.title,
                        prompt="Take a moment to enjoy this music.",
                        audioUrl=memory.audioUrl,
                        imageUrl=memory.imageUrl,
                        interactionMode="listen",
                        explanation="Thank you for spending a moment here.",
                    )
                )
        if policy.allowMemoryPrompt and self.content.consent.get("aiMayUseBiography", True):
            biography = []
            if self.patient.get("profession"):
                biography.append(("profession", self.patient["profession"]))
            for field in ("hobbies", "meaningfulPlaces"):
                biography.extend(
                    (f"{field}:{index}", value)
                    for index, value in enumerate(self.patient.get(field, []))
                    if value.strip()
                )
            for key, value in biography:
                result.append(
                    dict(
                        id=f"biography:{key}",
                        type="life_memory_recall",
                        title="Cognitive Exercise: Reminisce",
                        description=value,
                        prompt=f"Would you like to talk about {value}?",
                        interactionMode="reflection",
                        explanation="Thank you for sharing this moment.",
                    )
                )
        routines = [step.strip() for step in self.patient.get("routines", []) if step.strip()]
        if routines:
            steps = [dict(id=str(i), label=step) for i, step in enumerate(routines)]
            result.append(
                dict(
                    id="routine-sequencing",
                    type="daily_routine_sequencing",
                    title="Pattern Finding: Day Schedule",
                    description="Arrange daily steps in the right pattern and sequence",
                    prompt="Let’s look at your day together."
                    if policy.avoidMemoryTesting
                    else "Choose the steps in the order of your day.",
                    interactionMode="reflection" if policy.avoidMemoryTesting else "sequence",
                    steps=steps if policy.avoidMemoryTesting else list(reversed(steps)),
                    answer=[step["id"] for step in steps],
                    explanation="Your day: " + ", ".join(routines) + ".",
                )
            )
        elif self.patient.get("dailyRoutine"):
            result.append(
                dict(
                    id="routine-sequencing",
                    type="daily_routine_sequencing",
                    title="Daily Routine",
                    description="Your familiar day",
                    prompt=self.patient["dailyRoutine"],
                    interactionMode="reflection",
                    explanation="One step at a time.",
                )
            )
        return [
            dict(row, difficulty=difficulty)
            for row in result
            if self.patient.get("activityPreferences", {}).get(row["type"], True)
        ]

    def recommended(self) -> list[dict]:
        # One per type keeps the main list quiet; all data-backed items remain addressable.
        selected = {}
        for item in self.challenges():
            selected.setdefault(
                item["type"], {key: item[key] for key in ("id", "type", "title", "description")}
            )
        return list(selected.values())

    def get(self, activity_id: str) -> ActivityDetail:
        item = self._find(activity_id)
        if item["type"] == "music_memory":
            songs = [row["id"] for row in self.challenges() if row["type"] == "music_memory"]
            if len(songs) > 1:
                item["nextActivityId"] = songs[(songs.index(activity_id) + 1) % len(songs)]
        return ActivityDetail(**item)

    def _find(self, activity_id: str) -> dict:
        item = next((row for row in self.challenges() if row["id"] == activity_id), None)
        if not item:
            raise ResourceNotFoundError("This activity is not available right now.")
        return item

    def submit(self, activity_id: str, payload: ActivitySubmission) -> ActivityFeedback:
        item = self._find(activity_id)
        allowed = {option["id"] for option in item.get("options", []) + item.get("steps", [])}
        if any(value not in allowed for value in payload.response):
            raise ValidationError("Please choose an available answer.")
        if len(payload.response) != len(set(payload.response)):
            raise ValidationError("Each step can be selected once.")
        if payload.result == "liked" and item["interactionMode"] != "listen":
            raise ValidationError("This activity does not accept a music preference.")
        if payload.result == "completed":
            if item["interactionMode"] == "choice" and len(payload.response) != 1:
                raise ValidationError("Choose one answer.")
            if item["interactionMode"] == "sequence" and len(payload.response) != len(allowed):
                raise ValidationError("Choose each step.")
        feedback = "Take your time. We can do something else."
        if payload.result != "skipped":
            if item["interactionMode"] in ("choice", "sequence"):
                feedback = (
                    "That’s right."
                    if payload.response == item["answer"]
                    else "That’s okay. " + item["explanation"]
                )
            else:
                feedback = item["explanation"]
        result = ActivityFeedback(
            activityId=activity_id,
            patientId=self.patient["id"],
            timestamp=utcnow().isoformat(),
            feedback=feedback,
            **payload.model_dump(),
        )
        self.repository.create(self.patient["id"], result.model_dump())
        return result
