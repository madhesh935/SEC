"""Add Comfort Audio, Voice Greetings, and Rich Media to Eleanor's Profile.

This script updates:
1. Eleanor's comfortPreferences text.
2. Family member Sarah Jenkins with a playable voice greeting clip.
3. Dedicated comfort audio memories (Gentle Piano and English Garden Birdsong).
4. Audio clips attached to existing cherished memories (Cornwall holiday and Choir Gala).
5. Ensures consent settings permit voice recordings and media playback.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database.firestore import patient_doc, patients_collection
from app.database.firebase import server_timestamp
from app.database.repositories.family_repository import FamilyRepository
from app.database.repositories.memory_repository import MemoryRepository
from app.database.repositories.consent_repository import ConsentRepository
from app.models.enums import MemoryCategory, MemorySensitivity


def add_comfort_media_to_eleanor():
    # 1. Locate Eleanor
    query = patients_collection().where("firstName", "==", "Eleanor").limit(1).stream()
    patient_doc_snapshot = None
    for doc in query:
        patient_doc_snapshot = doc
        break

    if not patient_doc_snapshot:
        print("ERROR: Eleanor Vance patient profile not found.")
        return

    patient_id = patient_doc_snapshot.id
    print(f"Found Eleanor profile with ID: {patient_id}")

    # 2. Update Eleanor's comfortPreferences in patient record
    comfort_pref_text = (
        "Ellie finds deep comfort in soft classical piano (Debussy, Chopin) playing in the background, "
        "sitting with her warm wool lap blanket, and listening to familiar garden nature sounds. "
        "During periods of late-afternoon disorientation ('sundowning'), playing her daughter Sarah's "
        "voice message or gentle piano melodies quickly restores reassurance and tranquility."
    )
    patients_collection().document(patient_id).update({
        "comfortPreferences": comfort_pref_text,
        "updatedAt": server_timestamp(),
    })
    print("Updated Eleanor's comfort preferences.")

    # 3. Ensure consents allow voice recordings, photos, and memories
    consent_repo = ConsentRepository()
    consent_repo.update(patient_id, {
        "aiMayUseVoiceRecordings": True,
        "photosUsage": True,
        "memoriesUsage": True,
        "patientMaySeeMemory": True,
        "aiMayUseMemoryInternally": True,
        "aiMayMentionMemoryDirectly": True,
    })
    print("Updated consent permissions for voice and media playback.")

    # 4. Update Sarah Jenkins with recorded voice greeting
    family_repo = FamilyRepository()
    sarah_member = family_repo.find_by_name(patient_id, "Sarah Jenkins")
    voice_greeting_url = "https://raw.githubusercontent.com/mdn/webaudio-examples/main/audio-basics/outfoxing.mp3"

    if sarah_member:
        family_repo.update(patient_id, sarah_member["id"], {
            "voiceRecordingUrl": voice_greeting_url,
            "patientVisible": True,
        })
        print(f"Updated Sarah Jenkins with recorded voice greeting.")

    # 5. Add / Update Dedicated Comfort Audio Items in memories collection
    memory_repo = MemoryRepository()

    comfort_items = [
        {
            "title": "Gentle Piano Melody: Clair de Lune & Nocturnes",
            "description": "Calming classical piano performance in a slow, soothing tempo (60 bpm). Specifically configured for Ellie to relieve evening restlessness, provide reassurance, and inspire peaceful thoughts.",
            "category": MemoryCategory.MUSIC,
            "displayDate": "Daily Comfort",
            "audioUrl": "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
            "imageUrl": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
            "sensitivity": MemorySensitivity.LOW,
            "approved": True,
            "useForRedirection": True,
            "aiMayKnowInternally": True,
            "aiMayMentionDirectly": True,
            "visibleToPatient": True,
            "visibleToCaregiver": True,
            "emotionalTone": "calm",
            "associatedPeople": ["Sarah Jenkins"],
        },
        {
            "title": "English Rose Garden Birdsong & Morning Breeze",
            "description": "Natural ambient acoustic sounds of chirping robins, gentle wind through climbing roses, and morning tranquility. Used to gently awaken Ellie or ease sensory overstimulation.",
            "category": MemoryCategory.MUSIC,
            "displayDate": "Daily Comfort",
            "audioUrl": "https://cdn.freesound.org/previews/316/316847_4939433-lq.mp3",
            "imageUrl": "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=600&q=80",
            "sensitivity": MemorySensitivity.LOW,
            "approved": True,
            "useForRedirection": True,
            "aiMayKnowInternally": True,
            "aiMayMentionDirectly": True,
            "visibleToPatient": True,
            "visibleToCaregiver": True,
            "emotionalTone": "peaceful",
            "associatedPeople": ["Sarah Jenkins", "Robert Jenkins"],
        },
    ]

    for item in comfort_items:
        q = (
            patient_doc(patient_id)
            .collection("memories")
            .where("title", "==", item["title"])
            .limit(1)
            .stream()
        )
        existing = None
        for d in q:
            existing = d
            break

        if existing:
            memory_repo.update(patient_id, existing.id, item)
            print(f"Updated comfort item: '{item['title']}'")
        else:
            memory_repo.create(patient_id, item)
            print(f"Created comfort item: '{item['title']}'")

    # 6. Enhance existing memories with audio tracks
    memories_to_enrich = [
        (
            "Summer Holidays at Cornwall Seaside (1982)",
            "https://cdn.freesound.org/previews/316/316847_4939433-lq.mp3",
        ),
        (
            "Bristol Youth Choir Summer Gala (1995)",
            "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
        ),
    ]

    for title, audio_url in memories_to_enrich:
        q = (
            patient_doc(patient_id)
            .collection("memories")
            .where("title", "==", title)
            .limit(1)
            .stream()
        )
        for d in q:
            memory_repo.update(patient_id, d.id, {"audioUrl": audio_url})
            print(f"Enriched memory '{title}' with audio track.")

    print("--------------------------------------------------")
    print("ALL COMFORT AUDIO & MEDIA SUCCESSFULLY ADDED!")
    print("--------------------------------------------------")


if __name__ == "__main__":
    add_comfort_media_to_eleanor()
