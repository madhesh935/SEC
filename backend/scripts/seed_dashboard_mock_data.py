"""Seed realistic caregiver dashboard telemetry, conversation events,
activities history, and device connection status for Eleanor Vance.
"""

from __future__ import annotations

import datetime as dt
import sys
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database.firestore import patient_doc, patients_collection
from app.database.firebase import server_timestamp
from app.database.repositories.conversation_repository import (
    ConversationEventRepository,
    ConversationRepository,
)
from app.database.repositories.event_repository import (
    DistressEventRepository,
    RepetitionEventRepository,
)
from app.database.repositories.activity_repository import ActivityRepository
from app.database.repositories.device_repository import PatientDeviceRepository
from app.utils.datetime import utcnow


def seed_dashboard_mock_data():
    query = patients_collection().where("firstName", "==", "Eleanor").limit(1).stream()
    doc_snap = None
    for d in query:
        doc_snap = d
        break

    if not doc_snap:
        print("ERROR: Eleanor Vance not found.")
        return

    patient_id = doc_snap.id
    print(f"Found Eleanor profile with ID: {patient_id}")

    # 1. Update Patient record with rich biographySummary and current status
    now = utcnow()
    bio_summary = (
        "Eleanor Vance is a 76-year-old retired high school music teacher and choral director (32 years at Bristol High School). "
        "Mother to primary caregiver Sarah and grandmother to Sophia. She finds deep joy in classical piano (Debussy, Chopin), "
        "tending to heirloom English climbing roses, and reminiscing about summer family holidays in St Ives, Cornwall."
    )

    patients_collection().document(patient_id).update({
        "biographySummary": bio_summary,
        "updatedAt": server_timestamp(),
    })
    print("Updated Eleanor's biographySummary.")

    # 2. Register & connect companion device
    device_repo = PatientDeviceRepository()
    device_id = "tablet-livingroom-01"
    device_repo.bind(patient_id=patient_id, device_id=device_id)
    device_repo.touch(patient_id, device_id)
    print("Registered and connected companion device 'tablet-livingroom-01'.")

    # 3. Seed active conversation and conversation events
    conv_repo = ConversationRepository()
    conv_event_repo = ConversationEventRepository()
    distress_repo = DistressEventRepository()
    repetition_repo = RepetitionEventRepository()
    activity_repo = ActivityRepository()

    conv_id = "conv-today-morning"
    conv_repo.get_or_create(patient_id, conv_id)

    conversations_data = [
        {
            "offset_hours": 6,
            "transcript": "Good morning Ellie! How did you sleep last night?",
            "responseText": "Good morning! I slept peacefully. I am looking forward to my morning Earl Grey tea and toast with honey.",
            "topic": "morning_routine",
            "intent": "greeting",
            "emotion": "happy",
            "distressScore": 14.0,
            "strategies": ["NORMAL_CONVERSATION", "ROUTINE_REINFORCEMENT"],
        },
        {
            "offset_hours": 4,
            "transcript": "Can we listen to that nice piano song from earlier?",
            "responseText": "Certainly! Playing Clair de Lune by Claude Debussy. It always brings a calm feeling to the room.",
            "topic": "music_preference",
            "intent": "comfort_request",
            "emotion": "calm",
            "distressScore": 18.0,
            "strategies": ["COMFORT_MODE", "REASSURANCE"],
        },
        {
            "offset_hours": 2,
            "transcript": "Do you remember the seashells Sarah and I found on the beach in Cornwall?",
            "responseText": "Yes, St Ives in the summer of 1982! You and Sarah collected colorful sea shells and enjoyed lemon ice cream on the sunny beach.",
            "topic": "family_vacation",
            "intent": "reminiscence",
            "emotion": "happy",
            "distressScore": 15.0,
            "strategies": ["MEMORY_REDIRECTION", "REASSURANCE"],
        },
        {
            "offset_hours": 1,
            "transcript": "What time is Sarah coming by today?",
            "responseText": "Sarah will be here at 4:00 PM for afternoon chamomile tea and freshly baked scones.",
            "topic": "family_visit",
            "intent": "schedule_query",
            "emotion": "neutral",
            "distressScore": 22.0,
            "strategies": ["GENTLE_REORIENTATION", "ROUTINE_REINFORCEMENT"],
        },
    ]

    for item in conversations_data:
        event_time = now - dt.timedelta(hours=item["offset_hours"])
        conv_event = conv_event_repo.create(
            patient_id,
            {
                "conversationId": conv_id,
                "transcript": item["transcript"],
                "responseText": item["responseText"],
                "intent": item["intent"],
                "topic": item["topic"],
                "emotion": item["emotion"],
                "distressScore": item["distressScore"],
                "distressSeverity": "LOW",
                "strategies": item["strategies"],
                "safetyStatus": "normal",
                "uiMode": "normal",
                "createdAt": event_time,
            },
        )

        # Mirror in distress_events for trend chart
        distress_repo.create(
            patient_id,
            {
                "conversationId": conv_id,
                "eventId": conv_event.get("id"),
                "distressScore": item["distressScore"],
                "severity": "LOW",
                "contributingFactors": [],
                "emotion": item["emotion"],
                "strategies": item["strategies"],
                "createdAt": event_time,
            },
        )

    # 4. Seed Historical Distress Trend Points across the last 7 days
    for day_offset in range(1, 8):
        # 2 events per day showing natural gentle range (14 - 28)
        d_time_am = (now - dt.timedelta(days=day_offset)).replace(hour=10, minute=30)
        d_time_pm = (now - dt.timedelta(days=day_offset)).replace(hour=16, minute=15)

        distress_repo.create(
            patient_id,
            {
                "conversationId": f"conv-day-{day_offset}-am",
                "distressScore": 16.0 + (day_offset % 3) * 3.5,
                "severity": "LOW",
                "contributingFactors": [],
                "emotion": "calm",
                "strategies": ["NORMAL_CONVERSATION", "REASSURANCE"],
                "createdAt": d_time_am,
            },
        )
        distress_repo.create(
            patient_id,
            {
                "conversationId": f"conv-day-{day_offset}-pm",
                "distressScore": 22.0 + (day_offset % 2) * 4.0,
                "severity": "LOW",
                "contributingFactors": [],
                "emotion": "neutral",
                "strategies": ["MEMORY_REDIRECTION", "GENTLE_REORIENTATION"],
                "createdAt": d_time_pm,
            },
        )

    print("Seeded 18 distress & conversation event trend points.")

    # 5. Seed Repetition Event
    repetition_repo.create(
        patient_id,
        {
            "conversationId": conv_id,
            "topic": "family_visit",
            "semanticTopic": "Sarah's Afternoon Tea Time",
            "similarity": 0.84,
            "recentCount": 2,
            "strategiesUsed": ["GENTLE_REORIENTATION", "ROUTINE_REINFORCEMENT"],
            "createdAt": now - dt.timedelta(minutes=45),
        },
    )
    print("Seeded repetition observation event.")

    # 6. Seed Completed Cognitive Activities Results
    activities_data = [
        {
            "activityId": "family_recognition",
            "type": "family_recognition",
            "result": "completed",
            "response": ["sarah", "sophia"],
            "completionTime": 24.5,
            "timestamp": (now - dt.timedelta(hours=3)).isoformat(),
        },
        {
            "activityId": "routine-sequencing",
            "type": "daily_routine_sequencing",
            "result": "completed",
            "response": ["1", "2", "3", "4"],
            "completionTime": 38.0,
            "timestamp": (now - dt.timedelta(hours=1, minutes=30)).isoformat(),
        },
    ]

    for act in activities_data:
        activity_repo.create(patient_id, act)

    print("Seeded completed cognitive activities records.")
    print("--------------------------------------------------")
    print("DASHBOARD TELEMETRY SEED COMPLETED SUCCESSFULLY!")
    print("--------------------------------------------------")


if __name__ == "__main__":
    seed_dashboard_mock_data()
