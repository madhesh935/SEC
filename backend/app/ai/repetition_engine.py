"""Semantic repetition detection.

Compares the current utterance's embedding against recent patient utterances
using cosine similarity rather than exact text matching, so "Where is
Priya?" and "When will my daughter come?" can be recognized as the same
underlying topic (spec section 28).
"""

from __future__ import annotations

import datetime as dt

import numpy as np
from pydantic import BaseModel

from app.config import get_settings
from app.utils.similarity import cosine_similarity


class RecentUtterance(BaseModel):
    model_config = {"arbitrary_types_allowed": True}

    text: str
    embedding: list[float]
    created_at: dt.datetime


class RepetitionResult(BaseModel):
    isRepeated: bool
    semanticTopic: str | None
    similarity: float
    recentCount: int
    timeWindowMinutes: int


def analyze_repetition(
    current_text: str,
    current_embedding: np.ndarray,
    recent_utterances: list[RecentUtterance],
    time_window_minutes: int = 240,
    threshold: float | None = None,
) -> RepetitionResult:
    settings = get_settings()
    similarity_threshold = threshold if threshold is not None else settings.repetition_similarity_threshold

    now = dt.datetime.now(dt.timezone.utc)
    window_start = now - dt.timedelta(minutes=time_window_minutes)

    matches: list[tuple[str, float]] = []
    for utterance in recent_utterances:
        created_at = utterance.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=dt.timezone.utc)
        if created_at < window_start:
            continue
        similarity = cosine_similarity(current_embedding, np.array(utterance.embedding))
        if similarity >= similarity_threshold:
            matches.append((utterance.text, similarity))

    if not matches:
        return RepetitionResult(
            isRepeated=False,
            semanticTopic=None,
            similarity=0.0,
            recentCount=0,
            timeWindowMinutes=time_window_minutes,
        )

    matches.sort(key=lambda m: m[1], reverse=True)
    top_text, top_similarity = matches[0]
    return RepetitionResult(
        isRepeated=True,
        semanticTopic=top_text,
        similarity=round(top_similarity, 4),
        recentCount=len(matches),
        timeWindowMinutes=time_window_minutes,
    )
