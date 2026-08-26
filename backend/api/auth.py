from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from firebase_admin import auth
from google.cloud.firestore_v1 import SERVER_TIMESTAMP

from backend.services.firebase_service import db


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

security = HTTPBearer()


class UserProfile(BaseModel):
    name: str
    role: str = "user"


@router.get("/me")
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    id_token = credentials.credentials

    try:
        # Verify Firebase ID token
        decoded_token = auth.verify_id_token(id_token)

        uid = decoded_token["uid"]
        email = decoded_token.get("email")

        # Get user's Firestore profile
        user_ref = db.collection("users").document(uid)
        user_doc = user_ref.get()

        # If profile does not exist
        if not user_doc.exists:
            raise HTTPException(
                status_code=404,
                detail="User profile not found"
            )

        profile = user_doc.to_dict()

        return {
            "uid": uid,
            "email": email,
            "name": profile.get("name"),
            "role": profile.get("role")
        }

    except HTTPException:
        raise

    except Exception as e:
        print(f"Error fetching current user: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to fetch user profile"
        )


@router.post("/profile")
async def create_or_update_profile(
    profile: UserProfile,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    id_token = credentials.credentials

    try:
        # Verify Firebase ID token
        decoded_token = auth.verify_id_token(id_token)

        uid = decoded_token["uid"]
        email = decoded_token.get("email")

        # Reference to user's Firestore document
        user_ref = db.collection("users").document(uid)

        # Check whether profile already exists
        existing_user = user_ref.get()

        if existing_user.exists:
            # Update existing profile
            user_ref.update({
                "name": profile.name,
                "role": profile.role,
                "email": email
            })

            message = "User profile updated successfully"

        else:
            # Create new profile
            user_ref.set({
                "uid": uid,
                "name": profile.name,
                "email": email,
                "role": profile.role,
                "created_at": SERVER_TIMESTAMP
            })

            message = "User profile created successfully"

        return {
            "message": message,
            "uid": uid,
            "email": email,
            "name": profile.name,
            "role": profile.role
        }

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Firebase ID token"
        )