"""One-time Firestore bootstrap.

Does NOT create any mock/demo data. It only:
  1. Prints the composite indexes this backend requires (spec section 78) -
     create them via `firebase deploy --only firestore:indexes` using
     firestore.indexes.json, or the Firebase console.
  2. Optionally assigns the `admin` role to a real Firebase Auth UID you
     already control, so you have a first account able to assign further
     roles via POST /api/v1/auth/roles.

Usage:
    python scripts/initialize_firestore.py --admin-uid <firebase-uid>
"""

from __future__ import annotations

import argparse
import sys

sys.path.insert(0, ".")

REQUIRED_INDEXES = [
    ("patients", [("primaryCaregiverId", "ASC"), ("archived", "ASC")]),
    ("patients/*/conversation_events", [("conversationId", "ASC"), ("createdAt", "DESC")]),
    ("patients/*/repetition_events", [("createdAt", "DESC")]),
    ("patients/*/distress_events", [("createdAt", "DESC")]),
    ("patients/*/alerts", [("status", "ASC"), ("createdAt", "DESC")]),
    ("patients/*/calming_strategies", [("createdAt", "DESC")]),
]


def print_required_indexes() -> None:
    print("Required Firestore composite indexes:\n")
    for collection, fields in REQUIRED_INDEXES:
        field_desc = ", ".join(f"{name} {direction}" for name, direction in fields)
        print(f"  - {collection}: {field_desc}")
    print("\nSee firestore.indexes.json for the deployable definition.")


def assign_admin_role(uid: str) -> None:
    from app.database.repositories.user_repository import UserRepository

    UserRepository().upsert(uid, {"role": "admin"})
    print(f"Assigned 'admin' role to UID {uid}.")


def main() -> None:
    parser = argparse.ArgumentParser(description="Bootstrap Firestore for GeriCare AI.")
    parser.add_argument("--admin-uid", help="Real Firebase Auth UID to grant the admin role.")
    args = parser.parse_args()

    print_required_indexes()

    if args.admin_uid:
        assign_admin_role(args.admin_uid)


if __name__ == "__main__":
    main()
