from fastapi import APIRouter, UploadFile, File
from backend.services.pdf_service import extract_text_from_pdf
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

    return {
        "message": "PDF uploaded successfully",
        "filename": file.filename,
        "characters": len(pdf_text),
        "preview": pdf_text[:500]  # Return the first 500 characters as a preview
    }

