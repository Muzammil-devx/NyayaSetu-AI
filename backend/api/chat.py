from fastapi import APIRouter
from pydantic import BaseModel
from backend.services.ai_service import ask_gemini

router = APIRouter(prefix="/api", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
def chat(request: ChatRequest):
    reply = ask_gemini(request.message)

    return {
        "user": request.message,
        "assistant": reply
    }

    