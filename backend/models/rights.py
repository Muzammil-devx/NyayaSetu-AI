from pydantic import BaseModel
from typing import List

class RightsAnalysis(BaseModel):
    question: str
    answer: str
    rights: List[str]
    important_points: List[str]
    disclaimer: str

    