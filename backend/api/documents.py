from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Depends,
    HTTPException
)
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth, firestore
from backend.services.pdf_service import extract_text_from_pdf
from backend.services.ai_service import analyze_document
from backend.services.firebase_service import db
from backend.models.document import DocumentUploadResponse
import shutil
import os

router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"]
)

security = HTTPBearer()
UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@router.post(
    "/upload",
    response_model=DocumentUploadResponse
)
async def upload_pdf(
    file: UploadFile = File(...),
    credentials: HTTPAuthorizationCredentials = Depends(security)
    ):

    # Verify Firebase ID Token
    id_token = credentials.credentials

    try:
        decoded_token = auth.verify_id_token(id_token)

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Firebase ID token"
        )

    # Get logged-in user's UID
    uid = decoded_token["uid"]

    # Validate uploaded file
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )

    # Save PDF locally
    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Extract PDF text
        pdf_text = extract_text_from_pdf(file_path)

        if not pdf_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the PDF"
            )

        # Analyze document with AI
        analysis = analyze_document(pdf_text)

        # Save document analysis to Firestore
        document_ref = db.collection("documents").document()

        document_ref.set({
            "userId": uid,
            "filename": file.filename,
            "analysis": analysis.model_dump(),
            "uploadedAt": firestore.SERVER_TIMESTAMP,
            "status": "analyzed"
        })

        # Return response
        return {
            "message": "PDF analyzed successfully",
            "filename": file.filename,
            "analysis": analysis.model_dump()  # Convert Pydantic model to dictionary for JSON response
        }

    except HTTPException:
        raise

    except Exception as e:
        error_message = str(e)

        # Gemini temporary availability problem
        if "503" in error_message or "UNAVAILABLE" in error_message:
            raise HTTPException(
                status_code=503,
                detail="AI service is temporarily unavailable. Please try again later."
            )

        # Other unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {error_message}"
        )

@router.get("")
async def get_user_documents(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    # Verify Firebase ID Token
    id_token = credentials.credentials

    try:
        decoded_token = auth.verify_id_token(id_token)

        # Get Logged-in user's UID
        uid = decoded_token["uid"]

        # Get documents belonging to this user
        documents_ref = db.collection("documents")
        
        documents = documents_ref.where(
            filter=firestore.FieldFilter(
                "userId",
                "==",
                uid
            )
        ).stream()
        
        result = []

        for document in documents:
            document_data = document.to_dict()

            result.append({
                "id": document.id,
                "filename": document_data.get("filename"),
                "analysis": document_data.get("analysis"),
                "uploadedAt": document_data.get("uploadedAt"),
                "status": document_data.get("status")
            })
        return {
            "documents": result
        }
    
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Firebase ID token"
        )
