from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, Depends, Query

from app.dependencies import authorize_patient_access
from app.schemas.analytics import (
    DistressAnalyticsResponse,
    DistressTrendPoint,
    PatternAnalyticsResponse,
    RepeatedTopicItem,
    RepetitionAnalyticsResponse,
    StrategyEffectivenessItem,
)
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/patients/{patient_id}/analytics", tags=["Analytics"])


@router.get("/repetition", response_model=RepetitionAnalyticsResponse)
async def repetition_analytics(
    patient: dict = Depends(authorize_patient_access),
) -> RepetitionAnalyticsResponse:
    service = AnalyticsService()
    return RepetitionAnalyticsResponse(**service.repetition_analytics(patient["id"]))


@router.get("/distress", response_model=DistressAnalyticsResponse)
async def distress_analytics(
    patient: dict = Depends(authorize_patient_access),
) -> DistressAnalyticsResponse:
    service = AnalyticsService()
    return DistressAnalyticsResponse(**service.distress_analytics(patient["id"]))


@router.get("/patterns", response_model=PatternAnalyticsResponse)
async def pattern_analytics(
    patient: dict = Depends(authorize_patient_access),
) -> PatternAnalyticsResponse:
    service = AnalyticsService()
    return PatternAnalyticsResponse(**service.pattern_analytics(patient["id"]))


@router.get("/strategies", response_model=list[StrategyEffectivenessItem])
async def strategy_effectiveness(
    patient: dict = Depends(authorize_patient_access),
) -> list[StrategyEffectivenessItem]:
    service = AnalyticsService()
    return [StrategyEffectivenessItem(**s) for s in service.strategy_effectiveness(patient["id"])]


@router.get("/distress-trend", response_model=list[DistressTrendPoint])
async def distress_trend(
    range: Literal["today", "7d", "14d", "30d"] = Query(default="today"),
    patient: dict = Depends(authorize_patient_access),
) -> list[DistressTrendPoint]:
    service = AnalyticsService()
    return [DistressTrendPoint(**p) for p in service.distress_trend(patient["id"], range)]


@router.get("/frequent-topics", response_model=list[RepeatedTopicItem])
async def frequent_topics(
    patient: dict = Depends(authorize_patient_access),
) -> list[RepeatedTopicItem]:
    service = AnalyticsService()
    return [RepeatedTopicItem(**t) for t in service.frequently_repeated_topics(patient["id"])]
