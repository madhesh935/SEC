"""Datetime helpers used by analytics and pattern engines."""

from __future__ import annotations

import datetime as dt


def utcnow() -> dt.datetime:
    return dt.datetime.now(dt.UTC)


def hours_ago(hours: int) -> dt.datetime:
    return utcnow() - dt.timedelta(hours=hours)


def days_ago(days: int) -> dt.datetime:
    return utcnow() - dt.timedelta(days=days)


def to_hour_bucket(value) -> int:
    """Normalize a Firestore timestamp (or datetime) to an hour-of-day bucket."""
    if hasattr(value, "hour"):
        return value.hour
    if hasattr(value, "ToDatetime"):
        return value.ToDatetime().hour
    return 0


def is_evening(hour: int) -> bool:
    return 17 <= hour <= 21
