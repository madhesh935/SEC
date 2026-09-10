import datetime as dt

from app.ai.pattern_engine import compute_hourly_distribution, identify_high_risk_windows, is_hour_in_high_risk_window


def _event(hour: int, score: float) -> dict:
    return {"createdAt": dt.datetime(2024, 1, 1, hour, 0), "distressScore": score}


def test_recurring_evening_window_is_identified():
    events = []
    for day in range(4):
        events.append(_event(18, 80))
        events.append(_event(19, 75))
        events.append(_event(10, 10))

    hourly = compute_hourly_distribution(events)
    windows = identify_high_risk_windows(hourly, threshold=60, min_events=3)

    assert any(w.hourRangeStart <= 18 < w.hourRangeEnd for w in windows)
    assert is_hour_in_high_risk_window(18, windows) is True
    assert is_hour_in_high_risk_window(10, windows) is False


def test_insufficient_events_do_not_produce_a_fabricated_pattern():
    events = [_event(18, 90)]  # only one event - not enough to claim a pattern
    hourly = compute_hourly_distribution(events)
    windows = identify_high_risk_windows(hourly, threshold=60, min_events=3)
    assert windows == []
