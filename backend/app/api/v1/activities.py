"""Optional activities and family-connection prompts (spec sections 53, 55).

Activity content is derived only from legitimate, consented patient
information (approved memories, family records, configured stage) - never
auto-generated distressing memory tests.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.ai.llm_service import LLMService
from app.ai.stage_engine import get_stage_policy
from app.core.exceptions import LLMServiceError
from app.core.security import AuthenticatedUser
from app.dependencies import PatientAccessContext, get_current_user, get_patient_access_context
from app.models.enums import DementiaStage
from app.schemas.activity import ActivityRecommendation, ActivityResultRequest, FamilyPromptItem
from app.services.consent_service import ConsentService
from app.services.family_service import FamilyService
from app.services.memory_service import MemoryService

router = APIRouter(prefix="/patients/{patient_id}/activities", tags=["Activities"])
family_prompt_router = APIRouter(prefix="/patients/{patient_id}/family-prompts", tags=["Activities"])


@router.get("/recommended", response_model=list[ActivityRecommendation])
async def recommended_activities(
    context: PatientAccessContext = Depends(get_patient_access_context),
) -> list[ActivityRecommendation]:
    patient = context.patient
    stage = DementiaStage(patient.get("configuredStage", DementiaStage.EARLY.value))
    stage_policy = get_stage_policy(stage)

    recommendations: list[ActivityRecommendation] = []

    routine_text = patient.get("dailyRoutine") or ", ".join(patient.get("routines") or [])
    if routine_text:
        recommendations.append(
            ActivityRecommendation(
                id="routine-sequencing",
                type="daily_routine_sequencing",
                title="Daily Routine",
                description=f"Let's think through your day together: {routine_text}",
                iconName="calendar",
                estimatedMinutes=5,
            )
        )

    family_service = FamilyService()
    family_members = family_service.family_repository.list_patient_visible(patient["id"])
    if family_members and not stage_policy.avoidMemoryTesting:
        first = family_members[0]
        recommendations.append(
            ActivityRecommendation(
                id="family-recognition",
                type="family_recognition",
                title="Family Recognition",
                description=f"Would you like to look at a photo of {first.get('name')}?",
                iconName="users",
                estimatedMinutes=3,
            )
        )

    memory_service = MemoryService()
    memories = memory_service.memory_repository.list_patient_visible(patient["id"])
    if memories and stage_policy.allowMemoryPrompt:
        first_memory = memories[0]
        recommendations.append(
            ActivityRecommendation(
                id="life-memory-recall",
                type="life_memory_recall",
                title="Life Memory Recall",
                description=f"Would you like to talk about {first_memory.get('title')}?",
                iconName="book-open",
                estimatedMinutes=5,
            )
        )

    return recommendations


@router.post("/{activity_id}/result", status_code=204)
async def submit_activity_result(
    activity_id: str,
    payload: ActivityResultRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    context: PatientAccessContext = Depends(get_patient_access_context),
) -> None:
    from app.database.repositories.activity_repository import ActivityRepository

    ActivityRepository().create(
        context.patient["id"],
        {"activityId": activity_id, "outcome": payload.outcome, "notes": payload.notes},
    )


@family_prompt_router.get("", response_model=list[FamilyPromptItem])
async def family_prompts(
    context: PatientAccessContext = Depends(get_patient_access_context),
) -> list[FamilyPromptItem]:
    patient_id = context.patient["id"]
    consent_service = ConsentService()
    consent = consent_service.get_consent(patient_id)
    if not consent_service.is_biography_allowed_for_ai(consent):
        return []

    memory_service = MemoryService()
    memories = [
        m
        for m in memory_service.memory_repository.list_ai_usable(patient_id)
        if consent_service.is_memory_allowed_for_redirection(m, consent)
    ]
    if not memories:
        return []

    context_text = "\n".join(f"- {m.get('title')}: {m.get('description')}" for m in memories[:5])

    try:
        prompts = await LLMService().generate_family_prompt(context_text)
        source = "ai"
    except LLMServiceError:
        prompts = [f"Ask about {m.get('title')}." for m in memories[:3]]
        source = "fallback"

    return [
        FamilyPromptItem(
            id=f"family-prompt-{i}",
            topic=memories[i].get("title", "Family connection") if i < len(memories) else "Family connection",
            description=prompt_text,
            suggestedBy=source,
        )
        for i, prompt_text in enumerate(prompts)
    ]
