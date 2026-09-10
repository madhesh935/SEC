"""Optional activities and family-connection prompts (spec sections 53, 55).

Activity content is derived only from legitimate, consented patient
information (approved memories, family records, configured stage) - never
auto-generated distressing memory tests.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.ai.llm_service import LLMService
from app.core.exceptions import LLMServiceError
from app.dependencies import PatientAccessContext, get_patient_access_context
from app.schemas.activity import ActivityRecommendation, FamilyPromptItem
from app.schemas.patient_experience import ActivityDetail, ActivityFeedback, ActivitySubmission
from app.services.activity_service import ActivityService
from app.services.consent_service import ConsentService
from app.services.memory_service import MemoryService

router = APIRouter(prefix="/patients/{patient_id}/activities", tags=["Activities"])
family_prompt_router = APIRouter(
    prefix="/patients/{patient_id}/family-prompts", tags=["Activities"]
)


@router.get("/recommended", response_model=list[ActivityRecommendation])
async def recommended_activities(
    context: PatientAccessContext = Depends(get_patient_access_context),
):
    return ActivityService(context.patient).recommended()


@router.get("/{activity_id}", response_model=ActivityDetail)
async def activity_detail(
    activity_id: str, context: PatientAccessContext = Depends(get_patient_access_context)
):
    return ActivityService(context.patient).get(activity_id)


@router.post("/{activity_id}/result", response_model=ActivityFeedback)
async def submit_activity_result(
    activity_id: str,
    payload: ActivitySubmission,
    context: PatientAccessContext = Depends(get_patient_access_context),
):
    return ActivityService(context.patient).submit(activity_id, payload)


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
            topic=memories[i].get("title", "Family connection")
            if i < len(memories)
            else "Family connection",
            description=prompt_text,
            suggestedBy=source,
        )
        for i, prompt_text in enumerate(prompts)
    ]
