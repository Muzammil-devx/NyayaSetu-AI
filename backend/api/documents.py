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
import uuid


router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"]
)

security = HTTPBearer()

UPLOAD_FOLDER = "uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

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

    # Validate filename
    original_filename = file.filename or ""

    if not original_filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed."
        )

    # Generate safe unique filename
    safe_filename = f"{uuid.uuid4()}.pdf"

    file_path = os.path.join(
        UPLOAD_FOLDER,
        safe_filename
    )

    try:
        # Save uploaded file safely with size limit
        total_size = 0

        with open(file_path, "wb") as buffer:

            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                total_size += len(chunk)

                if total_size > MAX_FILE_SIZE:
                    raise HTTPException(
                        status_code=400,
                        detail="PDF file size must not exceed 10 MB."
                    )

                buffer.write(chunk)

        # Basic PDF file validation
        with open(file_path, "rb") as pdf_file:
            file_signature = pdf_file.read(5)

        if file_signature != b"%PDF-":
            raise HTTPException(
                status_code=400,
                detail="Invalid PDF file."
            )

        # Extract PDF text
        pdf_text = extract_text_from_pdf(file_path)

        if not pdf_text.strip():
            raise HTTPException(
                status_code=400,
                detail="Could not extract text from the PDF."
            )

        # Analyze document with AI
        analysis = analyze_document(pdf_text)

        # Save document analysis to Firestore
        document_ref = db.collection("documents").document()

        document_ref.set({
            "userId": uid,
            "filename": original_filename,
            "analysis": analysis.model_dump(),
            "uploadedAt": firestore.SERVER_TIMESTAMP,
            "status": "analyzed"
        })

        # Return response
        return {
            "message": "PDF analyzed successfully",
            "filename": original_filename,
            "analysis": analysis.model_dump()
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

        # Gemini quota/rate limit problem
        if "429" in error_message or "RESOURCE_EXHAUSTED" in error_message:
            raise HTTPException(
                status_code=503,
                detail="AI service is temporarily unavailable due to usage limits. Please try again later."
            )

        # Other unexpected errors
        raise HTTPException(
            status_code=500,
            detail="Document processing failed. Please try again later."
        )

    finally:
        # Remove temporary uploaded PDF
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass


@router.get("")
async def get_user_documents(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    # Verify Firebase ID Token
    id_token = credentials.credentials

    try:
        decoded_token = auth.verify_id_token(id_token)

        # Get logged-in user's UID
        uid = decoded_token["uid"]

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Firebase ID token"
        )

    # Get documents belonging to this user
    try:
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
            status_code=500,
            detail="Failed to retrieve documents"
        )


@router.delete("/{document_id}")
async def delete_user_document(
    document_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    # Verify Firebase ID Token
    id_token = credentials.credentials

    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token["uid"]

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired Firebase ID token"
        )

    # Find the requested Firestore document
    try:
        document_ref = db.collection("documents").document(document_id)
        document_snapshot = document_ref.get()

        if not document_snapshot.exists:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )

        document_data = document_snapshot.to_dict()

        # Ensure the document belongs to the logged-in user
        if document_data.get("userId") != uid:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )

        # Delete the Firestore record
        document_ref.delete()

        return {
            "message": "Document deleted successfully",
            "document_id": document_id
        }

    except HTTPException:
        raise

    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete document"
        )
