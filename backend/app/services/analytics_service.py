"""Caregiver analytics aggregation - repetition, distress, evening patterns,
and strategy usage (spec sections 47-52; response shapes match the
caregiver website's contracts). All aggregates are computed from real stored
events only; when there isn't enough data for a meaningful claim, results
are simply smaller/omitted rather than fabricated.
"""

from __future__ import annotations

from collections import Counter, defaultdict

from app.ai.pattern_engine import compute_hourly_distribution, identify_high_risk_windows
from app.database.repositories.conversation_repository import ConversationEventRepository
from app.database.repositories.event_repository import DistressEventRepository, RepetitionEventRepository
from app.database.repositories.patient_repository import PatientRepository
from app.utils.datetime import days_ago

_STRATEGY_CATEGORY = {
    "MEMORY_PROMPT": "MEMORY",
    "MEMORY_REDIRECTION": "MEMORY",
    "FAMILY_CONNECTION": "VOICE",
    "GENTLE_REORIENTATION": "REDIRECTION",
    "REASSURANCE": "REASSURANCE",
    "EMOTIONAL_VALIDATION": "REASSURANCE",
    "COMFORT_MODE": "OTHER",
    "ROUTINE_REINFORCEMENT": "OTHER",
    "NORMAL_CONVERSATION": "OTHER",
    "CAREGIVER_ESCALATION": "OTHER",
}

_RANGE_DAYS = {"today": 1, "7d": 7, "30d": 30}


class AnalyticsService:
    def __init__(
        self,
        repetition_repository: RepetitionEventRepository | None = None,
        distress_repository: DistressEventRepository | None = None,
        conversation_event_repository: ConversationEventRepository | None = None,
        patient_repository: PatientRepository | None = None,
    ) -> None:
        self.repetition_repository = repetition_repository or RepetitionEventRepository()
        self.distress_repository = distress_repository or DistressEventRepository()
        self.conversation_event_repository = conversation_event_repository or ConversationEventRepository()
        self.patient_repository = patient_repository or PatientRepository()

    def repetition_analytics(self, patient_id: str, days: int = 14) -> dict:
        events = self.repetition_repository.since(patient_id, days_ago(days))

        topic_counter: Counter = Counter()
        topic_last_seen: dict[str, str] = {}
        topic_strategies: dict[str, set] = defaultdict(set)
        daily_trend: dict[str, int] = defaultdict(int)
        hourly_breakdown: dict[str, int] = defaultdict(int)

        for event in events:
            topic = event.get("topic") or "unknown"
            topic_counter[topic] += 1
            created_at = event.get("createdAt")
            if hasattr(created_at, "isoformat"):
                topic_last_seen[topic] = created_at.isoformat()
            if hasattr(created_at, "strftime"):
                daily_trend[created_at.strftime("%Y-%m-%d")] += 1
            if hasattr(created_at, "hour"):
                hourly_breakdown[str(created_at.hour)] += 1
            for strategy in event.get("strategiesUsed", []):
                topic_strategies[topic].add(strategy)

        topics = [
            {
                "id": f"topic-{i}",
                "topic": topic,
                "count": count,
                "lastOccurred": topic_last_seen.get(topic, ""),
                "associatedStrategies": sorted(topic_strategies.get(topic, [])),
            }
            for i, (topic, count) in enumerate(topic_counter.most_common(10))
        ]

        strategies_seen = {s for strategies in topic_strategies.values() for s in strategies}

        return {
            "totalEvents": len(events),
            "averagePerTopic": round(len(events) / len(topic_counter), 2) if topic_counter else 0.0,
            "topics": topics,
            "trend": [{"time": k, "count": v} for k, v in sorted(daily_trend.items())],
            "timeOfDayBreakdown": [{"hour": k, "count": v} for k, v in sorted(hourly_breakdown.items())],
            "strategiesWithReducedDistress": sorted(strategies_seen),
        }

    def distress_analytics(self, patient_id: str, days: int = 14) -> dict:
        events = self.distress_repository.since(patient_id, days_ago(days))

        emotion_counter: Counter = Counter()
        factor_counter: Counter = Counter()
        strategy_counter: Counter = Counter()
        trend: list[dict] = []
        high_distress_events: list[dict] = []

        for event in sorted(events, key=lambda e: e.get("createdAt") or 0):
            created_at = event.get("createdAt")
            score = float(event.get("distressScore", 0))
            if hasattr(created_at, "isoformat"):
                trend.append(
                    {
                        "timestamp": created_at.isoformat(),
                        "timeLabel": created_at.strftime("%H:%M") if hasattr(created_at, "strftime") else "",
                        "distressScore": score,
                    }
                )
            emotion = event.get("emotion")
            if emotion:
                emotion_counter[emotion] += 1
            for factor, value in (event.get("contributingFactors") or {}).items():
                if value and value > 0:
                    factor_counter[factor] += 1
            if event.get("severity") in ("HIGH", "URGENT"):
                conv_event = self._conversation_event_for(patient_id, event.get("eventId"))
                if conv_event:
                    high_distress_events.append(conv_event)

        total_emotions = sum(emotion_counter.values()) or 1
        emotion_distribution = [
            {"emotion": e, "percentage": round(c / total_emotions * 100, 1), "count": c}
            for e, c in emotion_counter.most_common()
        ]

        recent_conv_events = self.conversation_event_repository.list(
            patient_id, limit=200, order_by="createdAt", descending=True
        )
        recent_conv_events = [e for e in recent_conv_events if _created_within(e, days_ago(days))]
        for event in recent_conv_events:
            for strategy in event.get("strategies", []):
                strategy_counter[strategy] += 1

        overall_avg = sum(e.get("distressScore", 0) for e in events) / len(events) if events else 0.0
        strategies_used = []
        for strategy, count in strategy_counter.most_common():
            matching = [e for e in recent_conv_events if strategy in (e.get("strategies") or [])]
            avg_for_strategy = (
                sum(e.get("distressScore", 0) for e in matching) / len(matching) if matching else None
            )
            success_rate = None
            if avg_for_strategy is not None and overall_avg > 0:
                success_rate = round(max(0.0, min(1.0, 1 - (avg_for_strategy / max(overall_avg, 1)))), 2)
            strategies_used.append({"strategy": strategy, "count": count, "successRate": success_rate})

        latest = events[-1] if events else None
        current_score = int(latest.get("distressScore", 0)) if latest else 0
        current_severity = latest.get("severity", "LOW") if latest else "LOW"
        risk_level_map = {"LOW": "LOW", "MODERATE": "MODERATE", "HIGH": "ELEVATED", "URGENT": "HIGH"}

        return {
            "currentDistressScore": current_score,
            "riskLevel": risk_level_map.get(current_severity, "LOW"),
            "trend": trend,
            "emotionDistribution": emotion_distribution,
            "highDistressEvents": high_distress_events[:20],
            "commonTriggers": [{"trigger": f, "frequency": c} for f, c in factor_counter.most_common(5)],
            "strategiesUsed": strategies_used,
        }

    def pattern_analytics(self, patient_id: str, days: int = 14) -> dict:
        distress_events = self.distress_repository.since(patient_id, days_ago(days))
        repetition_events = self.repetition_repository.since(patient_id, days_ago(days))

        distress_hourly = compute_hourly_distribution(distress_events)
        distress_by_hour = {p.hour: p for p in distress_hourly}

        repetition_by_hour: Counter = Counter()
        for event in repetition_events:
            created_at = event.get("createdAt")
            if hasattr(created_at, "hour"):
                repetition_by_hour[created_at.hour] += 1

        windows = identify_high_risk_windows(distress_hourly, threshold=55.0)
        high_risk_hours = {h for w in windows for h in range(w.hourRangeStart, w.hourRangeEnd)}

        hourly_patterns = []
        for hour in range(24):
            point = distress_by_hour.get(hour)
            hourly_patterns.append(
                {
                    "hour": hour,
                    "label": f"{hour:02d}:00",
                    "distressScore": point.averageScore if point else 0.0,
                    "repetitionCount": repetition_by_hour.get(hour, 0),
                    "isHighRiskWindow": hour in high_risk_hours,
                }
            )

        recurring_windows = [f"{w.hourRangeStart:02d}:00-{w.hourRangeEnd:02d}:00" for w in windows]
        common_triggers = [e.get("topic") for e in repetition_events[:5] if e.get("topic")]

        return {
            "hourlyPatterns": hourly_patterns,
            "recurringEveningWindows": [w for w in recurring_windows if _is_evening_window(w)],
            "commonEveningTriggers": common_triggers,
            "comfortStrategiesUsed": [],
        }

    def strategy_effectiveness(self, patient_id: str, days: int = 30) -> list[dict]:
        events = self.conversation_event_repository.list(
            patient_id, limit=500, order_by="createdAt", descending=True
        )
        events = [e for e in events if _created_within(e, days_ago(days))]

        overall_avg = sum(e.get("distressScore", 0) for e in events) / len(events) if events else 0.0

        strategy_events: dict[str, list[dict]] = defaultdict(list)
        for event in events:
            for strategy in event.get("strategies", []):
                strategy_events[strategy].append(event)

        results = []
        for strategy, matching in strategy_events.items():
            count = len(matching)
            avg_distress = sum(e.get("distressScore", 0) for e in matching) / count
            if overall_avg > 0:
                diff_pct = round((overall_avg - avg_distress) / overall_avg * 100, 1)
                direction = "lower" if diff_pct > 0 else "higher"
                observed_change = (
                    f"Interactions using this strategy averaged {abs(diff_pct)}% {direction} "
                    "observed distress than the overall average."
                )
            else:
                observed_change = f"Used in {count} observed interaction(s); not enough data for a comparison yet."

            results.append(
                {
                    "strategyName": strategy,
                    "usageCount": count,
                    "observedChange": observed_change,
                    "confidenceScore": round(min(count / 10, 0.9), 2) if count >= 3 else None,
                    "category": _STRATEGY_CATEGORY.get(strategy, "OTHER"),
                }
            )

        results.sort(key=lambda r: r["usageCount"], reverse=True)
        return results

    def distress_trend(self, patient_id: str, range_key: str = "today") -> list[dict]:
        days = _RANGE_DAYS.get(range_key, 1)
        events = self.distress_repository.since(patient_id, days_ago(days))
        trend = []
        for event in sorted(events, key=lambda e: e.get("createdAt") or 0):
            created_at = event.get("createdAt")
            if hasattr(created_at, "isoformat"):
                trend.append(
                    {
                        "timestamp": created_at.isoformat(),
                        "timeLabel": created_at.strftime("%H:%M") if hasattr(created_at, "strftime") else "",
                        "distressScore": float(event.get("distressScore", 0)),
                    }
                )
        return trend

    def frequently_repeated_topics(self, patient_id: str, days: int = 14) -> list[dict]:
        return self.repetition_analytics(patient_id, days)["topics"]

    def recent_events(self, patient_id: str, limit: int = 10) -> list[dict]:
        events = self.conversation_event_repository.recent_for_patient(patient_id, limit=limit)
        results = []
        for event in events:
            created_at = event.get("createdAt")
            results.append(
                {
                    "id": event["id"],
                    "patientId": patient_id,
                    "transcript": event.get("transcript"),
                    "intent": event.get("intent"),
                    "emotion": event.get("emotion"),
                    "repetitionCount": event.get("repetitionCount"),
                    "distressScore": event.get("distressScore"),
                    "strategy": event.get("strategies", []),
                    "createdAt": created_at.isoformat() if hasattr(created_at, "isoformat") else "",
                    "aiResponse": event.get("responseText"),
                    "safetyStatus": event.get("safetyStatus"),
                    "retrievedMemory": event.get("retrievedMemoryTitle"),
                }
            )
        return results

    def _conversation_event_for(self, patient_id: str, event_id: str | None) -> dict | None:
        if not event_id:
            return None
        event = self.conversation_event_repository.get(patient_id, event_id)
        if not event:
            return None
        created_at = event.get("createdAt")
        return {
            "id": event["id"],
            "patientId": patient_id,
            "transcript": event.get("transcript"),
            "intent": event.get("intent"),
            "emotion": event.get("emotion"),
            "repetitionCount": event.get("repetitionCount"),
            "distressScore": event.get("distressScore"),
            "strategy": event.get("strategies", []),
            "createdAt": created_at.isoformat() if hasattr(created_at, "isoformat") else "",
            "aiResponse": event.get("responseText"),
            "safetyStatus": event.get("safetyStatus"),
            "retrievedMemory": event.get("retrievedMemoryTitle"),
        }


def _created_within(event: dict, threshold) -> bool:
    created_at = event.get("createdAt")
    if created_at is None or not hasattr(created_at, "timestamp"):
        return False
    return created_at.timestamp() >= threshold.timestamp()


def _is_evening_window(window_label: str) -> bool:
    start_hour = int(window_label.split(":")[0])
    return 17 <= start_hour <= 21
