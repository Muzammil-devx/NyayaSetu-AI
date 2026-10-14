from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

from firebase_admin import auth, firestore

from backend.services.firebase_service import db
from backend.services.ai_service import analyze_rights


router = APIRouter(
    prefix="/api",
    tags=["Chat"]
)

security = HTTPBearer()


class ChatRequest(BaseModel):
    message: str = Field(
        min_length=1,
        max_length=1000,
    )


@router.post("/chat")
def chat(
    request: ChatRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    # Verify Firebase ID token
    try:
        decoded_token = auth.verify_id_token(credentials.credentials)
        uid = decoded_token["uid"]

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Firebase ID token"
        )

    question = request.message.strip()

    if not question:
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    try:
        # Generate Rights Navigator analysis
        analysis = analyze_rights(question)

        # Complete structured response
        result = analysis.model_dump()

        # Save all fields to Firestore
        chat_ref = db.collection("chats").document()

        chat_ref.set({
            "userId": uid,
            **result,
            "createdAt": firestore.SERVER_TIMESTAMP
        })

        # Return the full analysis to the frontend
        return {
            "uid": uid,
            **result
        }

    except Exception as e:
        error_message = str(e)

        if "503" in error_message or "UNAVAILABLE" in error_message:
            raise HTTPException(
                status_code=503,
                detail="AI service is temporarily unavailable. Please try again later."
            )

        if "429" in error_message or "RESOURCE_EXHAUSTED" in error_message:
            raise HTTPException(
                status_code=503,
                detail="AI service is temporarily unavailable due to usage limits. Please try again later."
            )

        print(f"Chat processing error: {error_message}")

        raise HTTPException(
            status_code=500,
            detail="Unable to process your legal rights question. Please try again later."
        )


@router.get("/chats")
def get_chat_history(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    # Verify Firebase ID token
    try:
        decoded_token = auth.verify_id_token(credentials.credentials)
        uid = decoded_token["uid"]

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Firebase ID token"
        )

    try:
        chats_ref = (
            db.collection("chats")
            .where(
                filter=firestore.FieldFilter(
                    "userId",
                    "==",
                    uid
                )
            )
            .stream()
        )

        chats = []

        for chat_doc in chats_ref:
            chat_data = chat_doc.to_dict()

            chats.append({
                "id": chat_doc.id,
                "question": chat_data.get("question", ""),
                "answer": chat_data.get("answer", ""),
                "rights": chat_data.get("rights", []),
                "important_points": chat_data.get("important_points", []),
                "situation_summary": chat_data.get("situation_summary", ""),
                "action_plan": chat_data.get("action_plan", []),
                "evidence_checklist": chat_data.get("evidence_checklist", []),
                "questions_to_clarify": chat_data.get("questions_to_clarify", []),
                "when_to_seek_help": chat_data.get("when_to_seek_help", []),
                "disclaimer": chat_data.get("disclaimer", ""),
                "createdAt": chat_data.get("createdAt")
            })

        # Sort newest chats first
        chats.sort(
            key=lambda item: (
                item["createdAt"].timestamp()
                if item["createdAt"] is not None
                else 0
            ),
            reverse=True
        )

        return {"chats": chats}

    except Exception as e:
        print(f"Chat history error: {str(e)}")

        raise HTTPException(
            status_code=500,
            detail="Unable to load chat history. Please try again later."
        )
