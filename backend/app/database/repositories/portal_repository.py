from __future__ import annotations

import datetime as dt

from google.cloud import firestore

from app.core.exceptions import AuthorizationError
from app.database.firebase import server_timestamp
from app.database.firestore import db, doc_to_dict, patient_doc, safe_call, users_collection
from app.database.repositories.base_repository import SubcollectionRepository


class AccessRepository(SubcollectionRepository):
    collection_name = "family_access"


class FamilyNotificationRepository(SubcollectionRepository):
    collection_name = "family_notifications"


class InvitationRepository:
    def create(self, hashed: str, data: dict):
        safe_call(
            db().collection("family_invitations").document(hashed).create,
            {**data, "createdAt": server_timestamp(), "used": False},
        )

    def accept(self, hashed: str, uid: str, email: str):
        ref = db().collection("family_invitations").document(hashed)
        user_ref = users_collection().document(uid)

        @firestore.transactional
        def accept(transaction):
            invite = doc_to_dict(ref.get(transaction=transaction))
            user = doc_to_dict(user_ref.get(transaction=transaction))
            if not invite or invite.get("used"):
                raise AuthorizationError("This invitation is not available.")
            expiry = invite.get("expiresAt")
            if (
                not hasattr(expiry, "timestamp")
                or expiry.timestamp() <= dt.datetime.now(dt.UTC).timestamp()
            ):
                raise AuthorizationError("This invitation has expired.")
            if not email or email.casefold() != invite["email"].casefold():
                raise AuthorizationError(
                    "Sign in with the email address invited by your caregiver."
                )
            if user and user.get("role") != "family":
                raise AuthorizationError("Use a family account to accept this invitation.")
            patient = doc_to_dict(patient_doc(invite["patientId"]).get(transaction=transaction))
            if (
                not patient
                or patient.get("archived")
                or patient.get("primaryCaregiverId") != invite["issuer"]
            ):
                raise AuthorizationError("This invitation is no longer valid.")
            grant = {k: invite[k] for k in ("patientId", "relationship", "permissions", "email")}
            grant.update(userId=uid, status="active", createdAt=server_timestamp())
            transaction.set(
                patient_doc(invite["patientId"]).collection("family_access").document(uid), grant
            )
            transaction.set(
                user_ref,
                {
                    "role": "family",
                    "email": email,
                    "familyPatientIds": firestore.ArrayUnion([invite["patientId"]]),
                },
                merge=True,
            )
            transaction.update(ref, {"used": True, "usedBy": uid, "usedAt": server_timestamp()})
            return grant

        return safe_call(accept, db().transaction())
