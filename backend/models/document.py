
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

class CompletenessItem(BaseModel):
    field_name: str = Field(
        description="Name of the important document field being checked"
    )
    status: Literal["Found", "Needs Review", "Not Found"] = Field(
        description="Whether the field is present, needs verification, or was not found"
    )
    explanation: str = Field(
        description="Evidence from the document or explanation of what needs checking"
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
    completeness_check: list[CompletenessItem] = Field(
        default_factory=list,
        description="Structured completeness checks for important document fields"
    )
    important_dates: list[str]
    disclaimer: str


class DocumentUploadResponse(BaseModel):
    message: str
    filename: str
    analysis: DocumentAnalysis
