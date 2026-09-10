"""Seed Eleanor Vance's rich patient profile directly into Firestore.

Populates all patient fields, default consents, family members, and
patient memories so that both the website portal and mobile patient app
have full, rich, realistic data reflected immediately.
"""

from __future__ import annotations

import datetime as dt
import sys
from pathlib import Path

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database.firestore import db, patient_doc, patients_collection, users_collection
from app.database.firebase import server_timestamp
from app.database.repositories.family_repository import FamilyRepository
from app.database.repositories.memory_repository import MemoryRepository
from app.database.repositories.consent_repository import ConsentRepository, DEFAULT_CONSENT
from app.models.enums import MemoryCategory, MemorySensitivity


def seed_eleanor_profile():
    # 1. Identify Caregiver UID
    # Look for Madhesh B (itmslKao6PNGFA4kqJL6f6cGzYC3) or the first available caregiver
    caregiver_uid = "itmslKao6PNGFA4kqJL6f6cGzYC3"
    cg_doc = users_collection().document(caregiver_uid).get()
    if not cg_doc.exists:
        # Fallback to any caregiver in DB
        for u in users_collection().stream():
            caregiver_uid = u.id
            break

    print(f"Linking patient to Caregiver UID: {caregiver_uid}")

    # 2. Check if Eleanor already exists
    query = patients_collection().where("firstName", "==", "Eleanor").limit(1).stream()
    existing_patient = None
    for doc in query:
        existing_patient = doc
        break

    patient_data = {
        "firstName": "Eleanor",
        "preferredName": "Ellie",
        "gender": "Female",
        "dateOfBirth": "1950-04-12",
        "age": 76,
        "preferredLanguage": "English",
        "configuredStage": "EARLY",
        "primaryCaregiverId": caregiver_uid,
        "profilePhotoUrl": "https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=600&q=80",
        "profession": "Retired High School Music Teacher & Choral Director",
        "hometown": "Bristol, England",
        "education": "Bachelor of Arts in Music Education, University of Bristol",
        "placesLived": [
            "Bristol, England",
            "Bath, England",
            "Oxford, England",
        ],
        "importantLifeEvents": [
            "Married high school sweetheart Robert in 1974 at St. Mary's Church",
            "Taught music and directed youth choirs for 32 years at Bristol High School",
            "Conducted the Bristol Youth Choir at the Colston Hall Summer Gala in 1995",
            "Welcomed first granddaughter Sophia in 2005",
            "Celebrated 40th wedding anniversary with a family holiday in St Ives, Cornwall in 2014",
        ],
        "hobbies": [
            "Gardening & pruning heirloom English roses",
            "Playing classical piano (Chopin, Debussy & Mozart)",
            "Baking traditional apple cinnamon scones and tarts",
            "Solving daily crossword puzzles and birdwatching in the garden",
            "Listening to BBC Radio 3 classical broadcasts",
        ],
        "favouriteTopics": [
            "Classical piano concertos and choir harmonies",
            "English garden flowers, lavender, and climbing roses",
            "Family summer holidays at the Cornwall seaside",
            "Traditional British baking recipes and afternoon tea",
            "Memories of her students' musical achievements",
        ],
        "favouriteFood": [
            "Warm homemade vegetable & barley soup",
            "Freshly baked scones with clotted cream and strawberry jam",
            "Shepherd's pie with roasted root vegetables",
            "Hot Earl Grey tea with a spoonful of wild clover honey",
            "Warm baked apples with cinnamon and custard",
        ],
        "favouriteMusic": [
            "Chopin - Nocturne in E-flat Major, Op. 9 No. 2",
            "Mozart - Clarinet Concerto in A Major, K. 622",
            "Debussy - Clair de Lune",
            "Vivaldi - The Four Seasons (Spring)",
            "Traditional Folk - Scarborough Fair",
        ],
        "meaningfulPlaces": [
            "St. Mary's Church Choir Loft (Bristol)",
            "Cornwall Seaside Beach & Coastal Cottages (St Ives)",
            "Bristol Botanic Gardens & Heritage Rose Pavilion",
            "The cozy sunroom piano nook at her home",
        ],
        "routines": [
            "08:00 AM - Morning Earl Grey tea and warm honey toast in the sunroom",
            "09:15 AM - Morning vitamins and prescription medication with water",
            "09:45 AM - Gentle garden walk: checking the roses and bird feeder",
            "11:00 AM - Listening to classical radio or playing gentle piano scales",
            "01:00 PM - Nutritious lunch: warm vegetable soup and crusty bread",
            "02:30 PM - Quiet reading time or looking through family photo albums",
            "04:00 PM - Afternoon chamomile tea and scone with daughter Sarah",
            "06:30 PM - Evening family dinner and relaxing conversation",
            "08:00 PM - Dimming ambient lights, listening to calming harp and piano music",
            "09:30 PM - Bedtime wind-down and peaceful night routine",
        ],
        "communicationPreferences": "Speak at a calm, unhurried pace using short, clear sentences. Ellie responds warmly to gentle smiles and eye contact. If she repeats a question or searches for a word, validate her thoughts warmly and steer naturally toward her favorite memories of music, gardening, or her daughter Sarah.",
        "comfortPreferences": "Ellie finds immediate calm when wrapped in her favorite knitted wool blanket in her armchair while listening to soft piano music (Debussy's Clair de Lune or Chopin) and sipping a warm mug of chamomile tea with honey. Showing her photos of the Cornwall coast or her family garden quickly eases evening restlessness.",
        "emergencyServicesPhone": "911",
        "emergencyContacts": [
            {
                "name": "Sarah Jenkins",
                "relationship": "Daughter (Primary Caregiver)",
                "phone": "+1 (555) 234-5678",
                "isPrimary": True,
            },
            {
                "name": "Dr. David Miller",
                "relationship": "Primary Neurologist / Physician",
                "phone": "+1 (555) 876-5432",
                "isPrimary": False,
            },
            {
                "name": "David Jenkins",
                "relationship": "Son-in-Law",
                "phone": "+1 (555) 345-6789",
                "isPrimary": False,
            },
        ],
        "archived": False,
        "updatedAt": server_timestamp(),
    }

    if existing_patient:
        patient_id = existing_patient.id
        patients_collection().document(patient_id).update(patient_data)
        print(f"Updated existing patient Eleanor with ID: {patient_id}")
    else:
        patient_data["createdAt"] = server_timestamp()
        doc_ref = patients_collection().document()
        patient_id = doc_ref.id
        patient_data["id"] = patient_id
        doc_ref.set(patient_data)
        print(f"Created new patient Eleanor with ID: {patient_id}")

    # 3. Configure Consents
    consent_repo = ConsentRepository()
    consent_repo.update(
        patient_id,
        {
            "aiMayUseBiography": True,
            "aiMayUseMemoryInternally": True,
            "aiMayMentionMemoryDirectly": True,
            "aiMayUseVoiceRecordings": True,
            "aiConversationEnabled": True,
            "patientMaySeeMemory": True,
            "caregiverMayAccess": True,
            "allowEmergencyEscalation": True,
            "personalDataCollection": True,
            "memoriesUsage": True,
            "photosUsage": True,
            "caregiverAccessLevel": "FULL",
            "familyAccessLevel": "APPROVED_ONLY",
            "dataRetentionDays": 365,
        },
    )
    print("Configured comprehensive consent settings.")

    # 4. Populate Family Members
    family_repo = FamilyRepository()
    family_members = [
        {
            "name": "Sarah Jenkins",
            "relationship": "Daughter (Primary Caregiver)",
            "description": "Ellie's devoted eldest daughter who visits every afternoon, prepares fresh meals, and coordinates all health appointments.",
            "phone": "+1 (555) 234-5678",
            "priority": 1,
            "photoUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80",
            "patientVisible": True,
        },
        {
            "name": "Sophia Jenkins",
            "relationship": "Granddaughter",
            "description": "Ellie's 16-year-old granddaughter who loves playing board games and learning piano from Ellie on weekends.",
            "phone": "+1 (555) 456-7890",
            "priority": 2,
            "photoUrl": "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
            "patientVisible": True,
        },
        {
            "name": "David Jenkins",
            "relationship": "Son-in-Law",
            "description": "Sarah's husband, helps Ellie with home maintenance and gardening chores every Saturday.",
            "phone": "+1 (555) 345-6789",
            "priority": 3,
            "patientVisible": True,
        },
        {
            "name": "Robert Jenkins",
            "relationship": "Late Husband (Remembrance)",
            "description": "Ellie's beloved husband of 40 years. Sharing fond memories of Robert brings Ellie joy and nostalgia.",
            "priority": 4,
            "patientVisible": True,
        },
    ]

    for member in family_members:
        existing = family_repo.find_by_name(patient_id, member["name"])
        if existing:
            family_repo.update(patient_id, existing["id"], member)
        else:
            family_repo.create(patient_id, member)
    print(f"Seeded {len(family_members)} family members.")

    # 5. Populate Memories
    memory_repo = MemoryRepository()
    memories = [
        {
            "title": "Summer Holidays at Cornwall Seaside (1982)",
            "description": "A wonderful week in St Ives staying in a white stone cottage overlooking the ocean. Walking down to Porthmeor beach with young Sarah, searching for colorful seashells, building sandcastles, and enjoying creamy lemon ice cream as seagulls circled overhead.",
            "category": MemoryCategory.TRAVEL,
            "displayDate": "July 1982",
            "imageUrl": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
            "sensitivity": MemorySensitivity.LOW,
            "approved": True,
            "useForRedirection": True,
            "aiMayKnowInternally": True,
            "aiMayMentionDirectly": True,
            "visibleToPatient": True,
            "visibleToCaregiver": True,
            "emotionalTone": "joyful",
            "associatedPeople": ["Sarah Jenkins", "Robert Jenkins"],
        },
        {
            "title": "Bristol Youth Choir Summer Gala (1995)",
            "description": "Conducting 80 high school students singing Mozart's Ave Verum Corpus in the grand auditorium of Colston Hall. The choir received a five-minute standing ovation, and Ellie's students presented her with a bouquet of yellow roses after the encore.",
            "category": MemoryCategory.CAREER,
            "displayDate": "June 1995",
            "imageUrl": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80",
            "sensitivity": MemorySensitivity.LOW,
            "approved": True,
            "useForRedirection": True,
            "aiMayKnowInternally": True,
            "aiMayMentionDirectly": True,
            "visibleToPatient": True,
            "visibleToCaregiver": True,
            "emotionalTone": "proud",
            "associatedPeople": ["Sarah Jenkins"],
        },
        {
            "title": "Baking Lemon Scones with Granddaughter Sophia",
            "description": "Teaching granddaughter Sophia how to make Eleanor's secret flaky scones in the sunny kitchen. Sophia had flour on her nose, and they laughed together while spreading homemade strawberry preserves and clotted cream on fresh warm scones.",
            "category": MemoryCategory.FAMILY,
            "displayDate": "Spring 2018",
            "imageUrl": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80",
            "sensitivity": MemorySensitivity.LOW,
            "approved": True,
            "useForRedirection": True,
            "aiMayKnowInternally": True,
            "aiMayMentionDirectly": True,
            "visibleToPatient": True,
            "visibleToCaregiver": True,
            "emotionalTone": "warm",
            "associatedPeople": ["Sophia Jenkins", "Sarah Jenkins"],
        },
        {
            "title": "Planting Heirloom Tea Roses in the Back Garden",
            "description": "Robert and Ellie spending a sunny Saturday in April building the wooden trellis and planting fragrant pink and peach English tea roses. Those same climbing roses still bloom outside Eleanor's sunroom window every spring.",
            "category": MemoryCategory.HOBBY,
            "displayDate": "April 1998",
            "imageUrl": "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80",
            "sensitivity": MemorySensitivity.LOW,
            "approved": True,
            "useForRedirection": True,
            "aiMayKnowInternally": True,
            "aiMayMentionDirectly": True,
            "visibleToPatient": True,
            "visibleToCaregiver": True,
            "emotionalTone": "peaceful",
            "associatedPeople": ["Robert Jenkins"],
        },
    ]

    for mem in memories:
        # Check if memory already exists by title
        q = (
            patient_doc(patient_id)
            .collection("memories")
            .where("title", "==", mem["title"])
            .limit(1)
            .stream()
        )
        existing_mem = None
        for d in q:
            existing_mem = d
            break

        if existing_mem:
            memory_repo.update(patient_id, existing_mem.id, mem)
        else:
            memory_repo.create(patient_id, mem)

    print(f"Seeded {len(memories)} rich patient memories.")

    # 6. Generate Pairing Code and PIN for instant testing
    from app.services.pairing_service import PairingService
    try:
        pairing_svc = PairingService()
        code_info = pairing_svc.create_pairing_code(caregiver_uid, patient_id)
        pin_info = pairing_svc.create_pairing_pin(caregiver_uid, patient_id)
        print("--------------------------------------------------")
        print("PATIENT PROFILE CREATED SUCCESSFULLY!")
        print(f"Patient ID:    {patient_id}")
        print(f"Pairing Code:  {code_info['pairing_code']}")
        print(f"Pairing PIN:   {pin_info['pin']}")
        print("--------------------------------------------------")
    except Exception as e:
        print(f"Patient created (ID: {patient_id}), pairing code error: {e}")

    return patient_id


if __name__ == "__main__":
    seed_eleanor_profile()
