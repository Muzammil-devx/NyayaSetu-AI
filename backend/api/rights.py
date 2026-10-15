from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from firebase_admin import auth
from firebase_admin.exceptions import FirebaseError
from backend.services.ai_service import analyze_rights

router = APIRouter(
    prefix="/api/rights",
    tags=["Legal Rights"]
)

security = HTTPBearer()

class RightsRequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)

@router.post("")
def get_legal_rights(
    request: RightsRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        auth.verify_id_token(credentials.credentials, check_revoked=True)
    except (
        auth.InvalidIdTokenError,
        auth.UserDisabledError,
        auth.UserNotFoundError,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Firebase ID token"
        )
    except auth.CertificateFetchError:
        raise HTTPException(
            status_code=503,
            detail="Authentication service is temporarily unavailable. Please try again later."
        )
    except FirebaseError:
        raise HTTPException(
            status_code=500,
            detail="Unable to verify Firebase ID token."
        )

    question = request.question.strip()
    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    analysis = analyze_rights(question)

    return {
        "message": "Legal rights analyzed successfully",
        "question": analysis.model_dump()
    }

    