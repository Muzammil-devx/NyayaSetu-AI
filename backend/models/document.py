
from typing import Literal

from pydantic import BaseModel, Field


class ClauseRisk(BaseModel):
    severity: Literal["High", "Medium", "Low"] = Field(
        description="AI-estimated risk screening level"
    )
    clause_text: str = Field(
        description="Relevant text quoted from the uploaded document"
    )
    explanation: str = Field(
        description="Simple English explanation of why the clause may be risky"
    )
    verification_questions: list[str] = Field(
        description="Questions the user should clarify or verify"
    )


class DocumentAnalysis(BaseModel):
    document_type: str
    summary: str
    important_clauses: list[str]
    rights: list[str]
    obligations: list[str]
    risks: list[str]
    clause_risks: list[ClauseRisk] = Field(
        default_factory=list,
        description="Structured Clause Risk Radar findings"
    )
    important_dates: list[str]
    disclaimer: str


class DocumentUploadResponse(BaseModel):
    message: str
    filename: str
    analysis: DocumentAnalysis
