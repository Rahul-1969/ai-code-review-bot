from pydantic import BaseModel

class RefreshResponse(BaseModel):
    message: str
    patterns_upserted: int
    preferred_category: str
    preferred_severity: str
    total_accepted: int
    total_rejected: int

class LearningSummary(BaseModel):
    preferred_category: str
    preferred_severity: str
    overall_confidence: float
