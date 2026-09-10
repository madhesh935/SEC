from fastapi import APIRouter, Depends

from app.dependencies import PatientAccessContext, get_patient_access_context
from app.schemas.activity import ComfortContentItem
from app.services.patient_content_service import PatientContentService

router = APIRouter(prefix="/patients/{patient_id}/comfort", tags=["Comfort"])


@router.get("", response_model=list[ComfortContentItem])
async def get_comfort_content(context: PatientAccessContext = Depends(get_patient_access_context)):
    return PatientContentService(context.patient).comfort()
