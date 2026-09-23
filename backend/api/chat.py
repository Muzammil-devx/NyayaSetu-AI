from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from firebase_admin import auth, firestore

from backend.services.firebase_service import db
from backend.services.ai_service import analyze_rights

router = APIRouter(
    prefix="/api",
    tags=["Chat"]
)

security = HTTPBearer()

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
def chat(
    request: ChatRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    # Get Firebase ID token
    id_token = credentials.credentials

    # Verify Firebase ID token
    try:
        decoded_token = auth.verify_id_token(id_token)

        # Get logged-in user's UID
        uid = decoded_token["uid"]

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Firebase ID token"
        )

    # Validate question
    if not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty."
        )

    try:
        analysis = analyze_rights(request.message)

        # Save chat history to Firestore
        chat_ref = db.collection("chats").document()

        chat_ref.set({
            "userId": uid,
            "question": analysis.question,
            "answer": analysis.answer,
            "rights": analysis.rights,
            "important_points": analysis.important_points,
            "disclaimer": analysis.disclaimer,
            "createdAt": firestore.SERVER_TIMESTAMP
        })

        return {
            "uid": uid,
            "question": analysis.question,
            "answer": analysis.answer,
            "rights": analysis.rights,
            "important_points": analysis.important_points,
            "disclaimer": analysis.disclaimer
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Legal rights analysis failed: {str(e)}"
        )

@router.get("/chats")
def get_chat_history(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    # Get Firebase ID token
    id_token = credentials.credentials

    # Verify Firebase ID token
    try:
        decoded_token = auth.verify_id_token(id_token)

        # Get logged-in user's UID
        uid = decoded_token["uid"]

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Firebase ID token"
        )

    try:
        # Fetch only chats belonging to the logged-in user
        chats_ref = (
            db.collection("chats")
            .where("userId", "==", uid)
            .stream()
        )

        chats = []

        for chat in chats_ref:
            chat_data = chat.to_dict()

            chats.append({
                "id": chat.id,
                "question": chat_data.get("question"),
                "answer": chat_data.get("answer"),
                "rights": chat_data.get("rights", []),
                "important_points": chat_data.get("important_points", []),
                "disclaimer": chat_data.get("disclaimer"),
                "createdAt": chat_data.get("createdAt")
            })

        # Sort latest chats first
        chats.sort(
            key=lambda chat: chat["createdAt"] or "",
            reverse=True
        )
        
        return {
            "chats": chats
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch chat history: {str(e)}"
        )