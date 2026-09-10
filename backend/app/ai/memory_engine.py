"""Personal memory retrieval: structured fact lookup + semantic search.

Per spec section 21, simple factual relationships ("who is my daughter?") are
answered from structured family records rather than vector search - semantic
search complements structured retrieval for open-ended recall, it does not
replace it. Vector search here is a local cosine-similarity implementation
kept behind this module so it can be swapped for a managed vector index
later (spec section 20) without touching callers.
"""

from __future__ import annotations

import numpy as np
from pydantic import BaseModel

from app.utils.similarity import top_k_by_similarity


class RetrievedMemory(BaseModel):
    id: str
    title: str
    description: str
    similarity: float
    mayMentionDirectly: bool
    useForRedirection: bool


def structured_family_lookup(name: str, family_members: list[dict]) -> dict | None:
    if not name:
        return None
    normalized = name.strip().lower()
    for member in family_members:
        if member.get("name", "").strip().lower() == normalized:
            return member
    return None


def retrieve_relevant_memories(
    query_embedding: np.ndarray,
    ai_usable_memories: list[dict],
    top_k: int = 3,
    min_similarity: float = 0.35,
) -> list[RetrievedMemory]:
    """`ai_usable_memories` must already be filtered by consent/approval
    (approved=True, aiMayKnowInternally=True) before reaching this function -
    this engine performs no consent checks of its own."""
    candidates = [
        (memory["id"], np.array(memory["embedding"]))
        for memory in ai_usable_memories
        if memory.get("embedding")
    ]
    if not candidates:
        return []

    ranked = top_k_by_similarity(
        query_embedding, candidates, k=top_k, min_similarity=min_similarity
    )
    by_id = {m["id"]: m for m in ai_usable_memories}

    results: list[RetrievedMemory] = []
    for memory_id, similarity in ranked:
        memory = by_id[memory_id]
        results.append(
            RetrievedMemory(
                id=memory_id,
                title=memory.get("title", ""),
                description=memory.get("description", ""),
                similarity=round(similarity, 4),
                mayMentionDirectly=bool(memory.get("aiMayMentionDirectly", False)),
                useForRedirection=bool(memory.get("useForRedirection", False)),
            )
        )
    return results
