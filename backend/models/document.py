
from typing import Literal

from pydantic import BaseModel, Field


class ClauseRisk(BaseModel):
    severity: Literal["High", "Medium", "Low"] | None = Field(
        default=None,
        description="AI-estimated risk screening level"
    )
    clause_text: str = Field(
        default="",
        description="Relevant text quoted from the uploaded document"
    )
    explanation: str = Field(
        default="",
        description="Simple English explanation of why the clause may be risky"
    )
    verification_questions: list[str] = Field(
        default_factory=list,
        description="Questions the user should clarify or verify"
    )
    evidence_verified: bool = Field(
        default=False,
        description="Whether the backend matched clause_text exactly in extracted text"
    )


class EvidenceFinding(BaseModel):
    finding_type: Literal[
        "Important Clause", "Right", "Obligation", "Risk", "Important Date"
    ] = "Important Clause"
    finding: str = ""
    evidence_text: str | None = None
    explanation: str = ""
    review_action: str = ""
    evidence_verified: bool = False

class CompletenessItem(BaseModel):
    field_name: str = Field(
        default="",
        description="Name of the important document field being checked"
    )
    status: Literal["Found", "Needs Review", "Not Found"] = Field(
        default="Needs Review",
        description="Whether the field is present, needs verification, or was not found in extracted text"
    )
    explanation: str = Field(
        default="",
        description="Evidence from the document or explanation of what needs checking"
    )
    evidence_text: str | None = None
    evidence_verified: bool = False

class DocumentAnalysis(BaseModel):
    document_type: str = "Unknown"
    summary: str = ""
    important_clauses: list[str] = Field(default_factory=list)
    rights: list[str] = Field(default_factory=list)
    obligations: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    clause_risks: list[ClauseRisk] = Field(
        default_factory=list,
        description="Structured Clause Risk Radar findings"
    )
    evidence_findings: list[EvidenceFinding] = Field(
        default_factory=list,
        description="Important findings with excerpts checked against extracted document text"
    )
    completeness_check: list[CompletenessItem] = Field(
        default_factory=list,
        description="Structured completeness checks for important document fields"
    )
    important_dates: list[str] = Field(default_factory=list)
    disclaimer: str = (
        "AI-generated informational content only; verify the original document "
        "and consult a qualified legal professional for important decisions."
    )


MAX_EVIDENCE_EXCERPT_LENGTH = 300


def verify_document_evidence(
    analysis: DocumentAnalysis,
    extracted_text: str,
) -> DocumentAnalysis:
    """Mark only short, exact excerpts from the extracted text as verified."""
    evidence_types = (
        ("Important Clause", analysis.important_clauses),
        ("Right", analysis.rights),
        ("Obligation", analysis.obligations),
        ("Risk", analysis.risks),
        ("Important Date", analysis.important_dates),
    )

    for finding_type, findings in evidence_types:
        for finding in findings:
            if not any(
                item.finding_type == finding_type and item.finding == finding
                for item in analysis.evidence_findings
            ):
                analysis.evidence_findings.append(
                    EvidenceFinding(
                        finding_type=finding_type,
                        finding=finding,
                        explanation="No supporting excerpt was supplied for this finding.",
                        review_action=(
                            "Review the original document text before relying on this finding."
                        ),
                    )
                )

    for finding in analysis.evidence_findings:
        excerpt = finding.evidence_text
        finding.evidence_verified = bool(
            excerpt
            and len(excerpt) <= MAX_EVIDENCE_EXCERPT_LENGTH
            and excerpt in extracted_text
        )
        if finding.evidence_verified:
            if not finding.explanation:
                finding.explanation = (
                    "This excerpt was found in extracted text, but no explanation "
                    "was supplied. Review its context before relying on this finding."
                )
            if not finding.review_action:
                finding.review_action = (
                    "Review the surrounding document wording and clarify any uncertainty."
                )
            continue

        finding.evidence_text = None
        finding.explanation = (
            "No short exact supporting excerpt could be verified in the extracted "
            "text. Treat this finding as unconfirmed and review the original document."
        )
        if not finding.review_action:
            finding.review_action = (
                "Check the original document wording and clarify it with a qualified professional."
            )

    for finding_type, attribute in (
        ("Important Clause", "important_clauses"),
        ("Right", "rights"),
        ("Obligation", "obligations"),
        ("Risk", "risks"),
        ("Important Date", "important_dates"),
    ):
        verified_findings = {
            item.finding
            for item in analysis.evidence_findings
            if item.finding_type == finding_type and item.evidence_verified
        }
        setattr(
            analysis,
            attribute,
            [finding for finding in getattr(analysis, attribute) if finding in verified_findings],
        )

    for risk in analysis.clause_risks:
        excerpt = risk.clause_text
        risk.evidence_verified = bool(
            excerpt
            and len(excerpt) <= MAX_EVIDENCE_EXCERPT_LENGTH
            and excerpt in extracted_text
        )
        if risk.evidence_verified:
            if risk.severity is None:
                risk.explanation = (
                    "The excerpt was verified, but a risk level was not established. "
                    "Review the wording and context before assessing its significance."
                )
            elif not risk.explanation:
                risk.explanation = (
                    "The excerpt was verified, but no explanation was supplied. "
                    "Review its context before relying on this risk assessment."
                )
            if not risk.verification_questions:
                risk.verification_questions = [
                    "What does this wording mean in the context of the full agreement?"
                ]
            continue

        risk.clause_text = ""
        risk.severity = None
        risk.explanation = (
            "Insufficient verified document evidence: no short exact supporting "
            "excerpt was found in the extracted text. Review the original wording "
            "before treating this as a risk."
        )
        risk.verification_questions = []

    for item in analysis.completeness_check:
        excerpt = item.evidence_text
        item.evidence_verified = bool(
            excerpt
            and len(excerpt) <= MAX_EVIDENCE_EXCERPT_LENGTH
            and excerpt in extracted_text
        )
        if item.evidence_verified:
            if item.status == "Not Found":
                item.status = "Needs Review"
                item.explanation = (
                    "An excerpt was found, but the field classification needs review."
                )
            elif not item.explanation:
                item.status = "Needs Review"
                item.explanation = (
                    "An exact excerpt was found, but no explanation was supplied. "
                    "Review whether it fully addresses this field."
                )
            continue

        item.evidence_text = None
        if item.status == "Found":
            item.status = "Needs Review"
            item.explanation = (
                "The claimed information could not be verified in extracted text. "
                "Review the original document before relying on this result."
            )
        elif item.status == "Not Found":
            item.explanation = (
                "This information was not found in the extracted text. This does "
                "not establish that it is absent from the original document."
            )
        elif not item.explanation:
            item.explanation = (
                "No exact excerpt was verified in extracted text; review the original document."
            )

    return analysis


class DocumentUploadResponse(BaseModel):
    message: str
    filename: str
    analysis: DocumentAnalysis
