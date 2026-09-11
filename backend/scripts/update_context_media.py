"""Update Eleanor Vance's records in Firestore with authentic context-aware media URLs."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database.firestore import db, patients_collection
from app.database.repositories.family_repository import FamilyRepository
from app.database.repositories.memory_repository import MemoryRepository

BACKEND_BASE = "http://127.0.0.1:8000"


def update_eleanor():
    # 1. Locate Eleanor
    query = patients_collection().where("firstName", "==", "Eleanor").limit(1).stream()
    patient_doc_snapshot = None
    for doc in query:
        patient_doc_snapshot = doc
        break

    if not patient_doc_snapshot:
        print("ERROR: Eleanor Vance not found in Firestore.")
        return

    pid = patient_doc_snapshot.id
    print(f"Found Eleanor profile: {pid}")

    # 2. Update Eleanor's profilePhotoUrl
    patients_collection().document(pid).update({
        "profilePhotoUrl": f"{BACKEND_BASE}/static/media/images/eleanor.jpg"
    })
    print("Updated profile photo.")

    # 3. Update Sarah Jenkins
    family_repo = FamilyRepository()
    sarah = family_repo.find_by_name(pid, "Sarah Jenkins")
    if sarah:
        family_repo.update(
            pid,
            sarah["id"],
            {
                "photoUrl": f"{BACKEND_BASE}/static/media/images/family_sarah.jpg",
                "voiceRecordingUrl": f"{BACKEND_BASE}/static/media/audio/sarah_voice.wav",
                "patientVisible": True,
            },
        )
        print("Updated Sarah Jenkins with authentic photo and spoken voice note.")

    # 4. Update Memories
    memory_repo = MemoryRepository()
    memories_stream = db().collection("patients").document(pid).collection("memories").stream()

    updates = {
        "Cornwall": {
            "imageUrl": f"{BACKEND_BASE}/static/media/images/cornwall.jpg",
            "audioUrl": f"{BACKEND_BASE}/static/media/audio/cornwall_waves.wav",
        },
        "Piano": {
            "imageUrl": f"{BACKEND_BASE}/static/media/images/piano.jpg",
            "audioUrl": f"{BACKEND_BASE}/static/media/audio/clair_de_lune.wav",
        },
        "Rose Garden": {
            "imageUrl": f"{BACKEND_BASE}/static/media/images/family_sarah.jpg",
            "audioUrl": f"{BACKEND_BASE}/static/media/audio/garden_birdsong.wav",
        },
        "Choir": {
            "audioUrl": f"{BACKEND_BASE}/static/media/audio/choir_harmony.wav",
        },
    }

    for m in memories_stream:
        data = m.to_dict()
        title = data.get("title", "")
        for key, media_update in updates.items():
            if key.lower() in title.lower():
                memory_repo.update(pid, m.id, media_update)
                print(f"Updated memory '{title}' -> {media_update}")

    print("Successfully updated Eleanor's context-aware audio and images in Firestore.")


if __name__ == "__main__":
    update_eleanor()
