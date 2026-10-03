from pydantic import BaseModel

class PatternResponse(BaseModel):
    id: int
    pattern_type: str
    pattern_name: str
    score: float
    confidence: float

    model_config = {"from_attributes": True}

class PatternSummary(BaseModel):
    preferred_category: str
    preferred_severity: str
    overall_confidence: float
