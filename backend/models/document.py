from pydantic import BaseModel

class DocumentAnalysis(BaseModel):
    document_type: str
    summary: str
    important_clauses: list[str]
    rights: list[str]
    obligations: list[str]
    risks: list[str]
    important_dates: list[str]
    disclaimer: str

class DocumentUploadResponse(BaseModel):
    message: str
    filename: str
    analysis: DocumentAnalysis

    