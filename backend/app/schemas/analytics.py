"""Caregiver-facing analytics schemas - field names match the caregiver
website's analytics contracts exactly. Language is deliberately non-clinical
(spec sections 47-52, 83) - these are observed interaction signals, not
diagnoses."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

from app.schemas.conversation import ConversationEvent


class DistressTrendPoint(BaseModel):
    timestamp: str
    timeLabel: str
    distressScore: float
    baselineScore: float | None = None


class RepeatedTopicItem(BaseModel):
    id: str
    topic: str
    count: int
    lastOccurred: str
    associatedStrategies: list[str] = Field(default_factory=list)


class TrendPoint(BaseModel):
    time: str
    count: int


class TimeOfDayCount(BaseModel):
    hour: str
    count: int


class RepetitionAnalyticsResponse(BaseModel):
    totalEvents: int
    averagePerTopic: float
    topics: list[RepeatedTopicItem] = Field(default_factory=list)
    trend: list[TrendPoint] = Field(default_factory=list)
    timeOfDayBreakdown: list[TimeOfDayCount] = Field(default_factory=list)
    strategiesWithReducedDistress: list[str] = Field(default_factory=list)


class EmotionDistributionItem(BaseModel):
    emotion: str
    percentage: float
    count: int


class TriggerFrequency(BaseModel):
    trigger: str
    frequency: int


class StrategyUsageCount(BaseModel):
    strategy: str
    count: int
    successRate: float | None = None


class DistressAnalyticsResponse(BaseModel):
    currentDistressScore: int | None
    riskLevel: Literal["LOW", "MODERATE", "ELEVATED", "HIGH"] | None
    trend: list[DistressTrendPoint] = Field(default_factory=list)
    emotionDistribution: list[EmotionDistributionItem] = Field(default_factory=list)
    highDistressEvents: list[ConversationEvent] = Field(default_factory=list)
    commonTriggers: list[TriggerFrequency] = Field(default_factory=list)
    strategiesUsed: list[StrategyUsageCount] = Field(default_factory=list)


class HourlyPatternItem(BaseModel):
    hour: int
    label: str
    distressScore: float | None
    repetitionCount: int
    isHighRiskWindow: bool


class ComfortStrategyUsage(BaseModel):
    strategy: str
    count: int
    observedChange: str


class PatternAnalyticsResponse(BaseModel):
    hourlyPatterns: list[HourlyPatternItem] = Field(default_factory=list)
    recurringEveningWindows: list[str] = Field(default_factory=list)
    commonEveningTriggers: list[str] = Field(default_factory=list)
    comfortStrategiesUsed: list[ComfortStrategyUsage] = Field(default_factory=list)


class StrategyEffectivenessItem(BaseModel):
    strategyName: str
    usageCount: int
    observedChange: str
    confidenceScore: float | None = None
    category: Literal["MUSIC", "MEMORY", "VOICE", "REDIRECTION", "REASSURANCE", "OTHER"]
