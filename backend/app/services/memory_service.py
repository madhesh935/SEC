"""Memory CRUD, including embedding generation on create/meaningful update
(spec sections 14, 19). Embeddings are stored internally and stripped before
any response schema serialization - MemoryResponse simply has no field for
them."""

from __future__ import annotations

from app.ai.embeddings import EmbeddingEngine
from app.core.audit import audit_log
from app.core.exceptions import ResourceNotFoundError
from app.database.repositories.memory_repository import MemoryRepository
from app.schemas.memory import MemoryCreateRequest, MemoryUpdateRequest


class MemoryService:
    def __init__(
        self,
        memory_repository: MemoryRepository | None = None,
        embedding_engine: EmbeddingEngine | None = None,
    ) -> None:
        self.memory_repository = memory_repository or MemoryRepository()
        self.embedding_engine = embedding_engine or EmbeddingEngine()

    @staticmethod
    def _embedding_text(title: str, description: str) -> str:
        return f"{title}. {description}"

    def list_memories(self, patient_id: str) -> list[dict]:
        return self.memory_repository.list(patient_id, order_by="createdAt", descending=True)

    def get_memory(self, patient_id: str, memory_id: str) -> dict:
        memory = self.memory_repository.get(patient_id, memory_id)
        if not memory:
            raise ResourceNotFoundError("Memory was not found.")
        return memory

    def create_memory(self, actor_uid: str, patient_id: str, payload: MemoryCreateRequest) -> dict:
        data = payload.model_dump(mode="json")
        embedding = self.embedding_engine.embed_text(self._embedding_text(data["title"], data["description"]))
        data["embedding"] = [float(x) for x in embedding]
        data["createdBy"] = actor_uid
        created = self.memory_repository.create(patient_id, data)
        audit_log(
            "memory_created",
            actor_uid,
            patient_id=patient_id,
            memory_id=created["id"],
            sensitivity=data.get("sensitivity"),
        )
        return created

    def update_memory(
        self, actor_uid: str, patient_id: str, memory_id: str, payload: MemoryUpdateRequest
    ) -> dict:
        existing = self.get_memory(patient_id, memory_id)
        data = {k: v for k, v in payload.model_dump(mode="json").items() if v is not None}
        if "title" in data or "description" in data:
            title = data.get("title", existing.get("title", ""))
            description = data.get("description", existing.get("description", ""))
            embedding = self.embedding_engine.embed_text(self._embedding_text(title, description))
            data["embedding"] = [float(x) for x in embedding]

        sensitive_permission_changed = any(
            k in data for k in ("aiMayMentionDirectly", "aiMayKnowInternally", "visibleToPatient", "sensitivity")
        )
        if data:
            self.memory_repository.update(patient_id, memory_id, data)
            audit_log(
                "memory_updated",
                actor_uid,
                patient_id=patient_id,
                memory_id=memory_id,
                sensitive_permission_changed=sensitive_permission_changed,
            )
        return self.get_memory(patient_id, memory_id)

    def delete_memory(self, actor_uid: str, patient_id: str, memory_id: str) -> None:
        self.get_memory(patient_id, memory_id)
        self.memory_repository.delete(patient_id, memory_id)
        audit_log("memory_deleted", actor_uid, patient_id=patient_id, memory_id=memory_id)
