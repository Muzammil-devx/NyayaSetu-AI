from fastapi import APIRouter, UploadFile, File
from backend.services.pdf_service import extract_text_from_pdf
from backend.services.ai_service import analyze_document
import shutil
import os

router = APIRouter(
    prefix="/api/documents",
    tags=["Documents"]
)

UPLOAD_FOLDER = "uploads"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    file_path = os.path.join(
        UPLOAD_FOLDER,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    pdf_text = extract_text_from_pdf(file_path)
    analysis = analyze_document(pdf_text)

    return {
        "message": "PDF analyzed successfully",
        "filename": file.filename,
        "analysis": analysis.model_dump()  # Convert Pydantic model to dictionary for JSON response
    }

