"""Vector similarity helpers used by the repetition and memory engines."""

from __future__ import annotations

import numpy as np


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    a_norm = np.linalg.norm(a)
    b_norm = np.linalg.norm(b)
    if a_norm == 0 or b_norm == 0:
        return 0.0
    return float(np.dot(a, b) / (a_norm * b_norm))


def top_k_by_similarity(
    query_vector: np.ndarray,
    candidates: list[tuple[str, np.ndarray]],
    k: int = 3,
    min_similarity: float = 0.0,
) -> list[tuple[str, float]]:
    scored = [
        (candidate_id, cosine_similarity(query_vector, vector))
        for candidate_id, vector in candidates
    ]
    scored = [item for item in scored if item[1] >= min_similarity]
    scored.sort(key=lambda item: item[1], reverse=True)
    return scored[:k]
