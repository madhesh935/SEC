"""Evening / time-of-day behaviour pattern analysis.

Uses explainable time-window aggregation (rolling hourly means) rather than a
neural model (spec section 49). Output is deliberately phrased as a
"possible recurring pattern", never a sundowning diagnosis.
"""

from __future__ import annotations

from collections import defaultdict

from pydantic import BaseModel

from app.utils.datetime import to_hour_bucket


class HourlyPoint(BaseModel):
    hour: int
    averageScore: float
    eventCount: int


class HighRiskWindow(BaseModel):
    hourRangeStart: int
    hourRangeEnd: int
    averageRisk: float
    eventCount: int


def compute_hourly_distribution(distress_events: list[dict]) -> list[HourlyPoint]:
    buckets: dict[int, list[float]] = defaultdict(list)
    for event in distress_events:
        hour = to_hour_bucket(event.get("createdAt"))
        score = event.get("distressScore") or event.get("score") or 0
        buckets[hour].append(float(score))

    points = [
        HourlyPoint(hour=hour, averageScore=sum(scores) / len(scores), eventCount=len(scores))
        for hour, scores in buckets.items()
    ]
    points.sort(key=lambda p: p.hour)
    return points


def identify_high_risk_windows(
    hourly_points: list[HourlyPoint], threshold: float, min_events: int = 3
) -> list[HighRiskWindow]:
    """Group contiguous hours whose average score exceeds `threshold` and
    which have enough events to be a meaningful (not fabricated) pattern."""
    qualifying = {
        p.hour for p in hourly_points if p.averageScore >= threshold and p.eventCount >= min_events
    }
    if not qualifying:
        return []

    by_hour = {p.hour: p for p in hourly_points}
    sorted_hours = sorted(qualifying)

    windows: list[HighRiskWindow] = []
    start = sorted_hours[0]
    prev = start
    group = [start]

    def flush(group_hours: list[int]) -> HighRiskWindow:
        scores = [by_hour[h].averageScore for h in group_hours]
        counts = [by_hour[h].eventCount for h in group_hours]
        return HighRiskWindow(
            hourRangeStart=group_hours[0],
            hourRangeEnd=group_hours[-1] + 1,
            averageRisk=round(sum(scores) / len(scores), 1),
            eventCount=sum(counts),
        )

    for hour in sorted_hours[1:]:
        if hour == prev + 1:
            group.append(hour)
        else:
            windows.append(flush(group))
            group = [hour]
        prev = hour
    windows.append(flush(group))
    return windows


def is_hour_in_high_risk_window(hour: int, windows: list[HighRiskWindow]) -> bool:
    return any(w.hourRangeStart <= hour < w.hourRangeEnd for w in windows)
