from fastapi import APIRouter, Depends

from app.dependencies import PatientAccessContext, get_patient_access_context
from app.schemas.patient_experience import HomeRecommendation, PatientSettings
from app.services.patient_experience_service import PatientExperienceService

router = APIRouter(prefix="/patients/{patient_id}", tags=["Patients"])


@router.get("/settings", response_model=PatientSettings)
async def settings(context: PatientAccessContext = Depends(get_patient_access_context)):
    return PatientExperienceService().settings(context.patient)


@router.put("/settings", response_model=PatientSettings)
async def save_settings(
    payload: PatientSettings, context: PatientAccessContext = Depends(get_patient_access_context)
):
    return PatientExperienceService().save_settings(context.patient, payload)


@router.get("/recommendation", response_model=HomeRecommendation | None)
async def recommendation(context: PatientAccessContext = Depends(get_patient_access_context)):
    return PatientExperienceService().recommendation(context.patient)
