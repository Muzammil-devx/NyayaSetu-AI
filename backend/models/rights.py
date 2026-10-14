
from pydantic import BaseModel, Field


class RightsAnalysis(BaseModel):
    question: str = Field(
        description="The original legal rights question asked by the user"
    )
    answer: str = Field(
        description="A clear, simple-English overview of the situation"
    )
    rights: list[str] = Field(
        description="Potentially relevant rights under Indian law, with necessary conditions"
    )
    important_points: list[str] = Field(
        description="Important legal considerations, limitations, and practical points"
    )
    situation_summary: str = Field(
        description="A short summary of the user's reported situation"
    )
    action_plan: list[str] = Field(
        description="Practical, ordered steps the user can consider taking"
    )
    evidence_checklist: list[str] = Field(
        description="Evidence or documents that may be useful to collect or preserve"
    )
    questions_to_clarify: list[str] = Field(
        description="Follow-up questions needed to better understand the situation"
    )
    when_to_seek_help: list[str] = Field(
        description="Circumstances in which the user should seek qualified legal help or legal aid"
    )
    disclaimer: str = Field(
        description="A clear disclaimer that this is general information, not professional legal advice"
    )
