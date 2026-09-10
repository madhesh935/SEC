from __future__ import annotations

from app.core.audit import audit_log
from app.core.exceptions import ResourceNotFoundError
from app.database.repositories.family_repository import FamilyRepository
from app.schemas.family import FamilyCreateRequest, FamilyUpdateRequest


class FamilyService:
    def __init__(self, family_repository: FamilyRepository | None = None) -> None:
        self.family_repository = family_repository or FamilyRepository()

    def list_family(self, patient_id: str) -> list[dict]:
        return self.family_repository.list(patient_id, order_by="priority", descending=False)

    def get_family_member(self, patient_id: str, family_id: str) -> dict:
        member = self.family_repository.get(patient_id, family_id)
        if not member:
            raise ResourceNotFoundError("Family member was not found.")
        return member

    def create_family_member(
        self, actor_uid: str, patient_id: str, payload: FamilyCreateRequest
    ) -> dict:
        created = self.family_repository.create(patient_id, payload.model_dump(mode="json"))
        audit_log(
            "family_member_created", actor_uid, patient_id=patient_id, family_id=created["id"]
        )
        return created

    def update_family_member(
        self, actor_uid: str, patient_id: str, family_id: str, payload: FamilyUpdateRequest
    ) -> dict:
        self.get_family_member(patient_id, family_id)
        data = {k: v for k, v in payload.model_dump(mode="json").items() if v is not None}
        if data:
            self.family_repository.update(patient_id, family_id, data)
            audit_log(
                "family_access_changed", actor_uid, patient_id=patient_id, family_id=family_id
            )
        return self.get_family_member(patient_id, family_id)

    def delete_family_member(self, actor_uid: str, patient_id: str, family_id: str) -> None:
        self.get_family_member(patient_id, family_id)
        self.family_repository.delete(patient_id, family_id)
        audit_log("family_member_deleted", actor_uid, patient_id=patient_id, family_id=family_id)
