import datetime as dt

import numpy as np

from app.ai.repetition_engine import RecentUtterance, analyze_repetition


def _vec(seed: float) -> np.ndarray:
    rng = np.random.default_rng(int(seed * 1000))
    base = rng.normal(size=8)
    return base / np.linalg.norm(base)


def test_semantically_similar_question_detected_as_repeated():
    now = dt.datetime.now(dt.UTC)
    vector = _vec(1.0)
    # Near-duplicate embedding simulating "Where is my daughter?" vs "When will my daughter come?"
    similar_vector = vector + np.random.default_rng(2).normal(scale=0.01, size=vector.shape)
    similar_vector = similar_vector / np.linalg.norm(similar_vector)

    recent = [RecentUtterance(text="Where is my daughter?", embedding=list(vector), created_at=now)]
    result = analyze_repetition(
        "When will my daughter come?", similar_vector, recent, threshold=0.9
    )

    assert result.isRepeated is True
    assert result.recentCount == 1


def test_unrelated_question_not_flagged_as_repeated():
    now = dt.datetime.now(dt.UTC)
    recent = [RecentUtterance(text="What's for lunch?", embedding=list(_vec(1.0)), created_at=now)]
    result = analyze_repetition("Where is my daughter?", _vec(99.0), recent, threshold=0.9)

    assert result.isRepeated is False
    assert result.recentCount == 0


def test_utterances_outside_time_window_are_ignored():
    old_time = dt.datetime.now(dt.UTC) - dt.timedelta(hours=10)
    vector = _vec(5.0)
    recent = [
        RecentUtterance(text="Where is my daughter?", embedding=list(vector), created_at=old_time)
    ]

    result = analyze_repetition(
        "Where is my daughter?", vector, recent, time_window_minutes=60, threshold=0.5
    )

    assert result.isRepeated is False
