from fastapi import APIRouter
from pydantic import BaseModel
from backend.services.ai_service import analyze_rights

router = APIRouter(
    prefix="/api/rights",
    tags=["Legal Rights"]
)

class RightsRequest(BaseModel):
    question: str

@router.post("")
def get_legal_rights(request: RightsRequest):
    analysis = analyze_rights(request.question)

    return {
        "message": "Legal rights analyzed successfully",
        "question": analysis.model_dump()
    }

    