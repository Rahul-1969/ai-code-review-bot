"""
pattern_routes.py
-----------------
FastAPI router for querying learned patterns stored in the database.

Endpoints:
    GET /patterns/         — List all Pattern rows
    GET /patterns/summary  — Compute preferred category, severity, and confidence
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from database.database import get_db
from database.models import Pattern

router = APIRouter(prefix="/patterns", tags=["Patterns"])


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class PatternResponse(BaseModel):
    """Serialised representation of a :class:`Pattern` row.

    Attributes:
        id:           Primary key.
        pattern_type: Dimension tracked — ``"severity"``, ``"category"``,
                      or ``"keyword"``.
        pattern_name: The specific value (e.g. ``"critical"``, ``"security"``).
        score:        Raw frequency / occurrence count.
        confidence:   Acceptance rate in ``[0.0, 1.0]``.
    """

    id: int
    pattern_type: str
    pattern_name: str
    score: int
    confidence: float

    model_config = {"from_attributes": True}


class PatternSummary(BaseModel):
    """Aggregated insights derived from the Pattern table.

    Attributes:
        preferred_category: Pattern name with the highest combined score
                            among ``pattern_type="category"`` rows.
        preferred_severity: Pattern name with the highest combined score
                            among ``pattern_type="severity"`` rows.
        overall_confidence: Weighted average confidence across all patterns.
    """

    preferred_category: str
    preferred_severity: str
    overall_confidence: float


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _top_pattern_name(db: Session, pattern_type: str) -> str:
    """Return the pattern_name with the highest total score for *pattern_type*.

    Args:
        db:           Active database session.
        pattern_type: One of ``"category"``, ``"severity"``, ``"keyword"``.

    Returns:
        The winning pattern name, or ``"N/A"`` if no rows exist for that type.
    """
    result = (
        db.query(Pattern.pattern_name, func.sum(Pattern.score).label("total"))
        .filter(Pattern.pattern_type == pattern_type)
        .group_by(Pattern.pattern_name)
        .order_by(func.sum(Pattern.score).desc())
        .first()
    )
    return result[0] if result else "N/A"


def _overall_confidence(db: Session) -> float:
    """Compute the score-weighted average confidence across all patterns.

    Weighted average prevents low-frequency patterns from skewing the result.

    Formula:
        ``sum(score * confidence) / sum(score)``

    Args:
        db: Active database session.

    Returns:
        Weighted average in ``[0.0, 1.0]``, or ``0.0`` if no patterns exist.
    """
    result = db.query(
        func.sum(Pattern.score * Pattern.confidence),
        func.sum(Pattern.score),
    ).first()

    weighted_sum, total_score = result if result else (None, None)
    if not total_score:
        return 0.0
    return round(float(weighted_sum) / float(total_score), 4)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get(
    "/",
    summary="List all patterns",
    response_description="All learned patterns ordered by score descending.",
    response_model=list[PatternResponse],
)
def list_patterns(db: Session = Depends(get_db)) -> list[Pattern]:
    """Return all :class:`Pattern` rows ordered by score descending.

    Args:
        db: Injected database session.

    Returns:
        List of :class:`PatternResponse` objects.
    """
    return (
        db.query(Pattern)
        .order_by(Pattern.score.desc())
        .all()
    )


@router.get(
    "/summary",
    summary="Pattern summary",
    response_description="Preferred category, severity, and overall confidence.",
    response_model=PatternSummary,
)
def pattern_summary(db: Session = Depends(get_db)) -> PatternSummary:
    """Compute aggregated insights from the Pattern table.

    Aggregations:
        * **preferred_category** — pattern with the highest total score
          where ``pattern_type = "category"``.
        * **preferred_severity** — pattern with the highest total score
          where ``pattern_type = "severity"``.
        * **overall_confidence** — score-weighted average of all pattern
          confidence values.

    Args:
        db: Injected database session.

    Returns:
        A :class:`PatternSummary` with the three computed values.
    """
    return PatternSummary(
        preferred_category=_top_pattern_name(db, "category"),
        preferred_severity=_top_pattern_name(db, "severity"),
        overall_confidence=_overall_confidence(db),
    )
