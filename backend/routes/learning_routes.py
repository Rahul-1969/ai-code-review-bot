"""
learning_routes.py
------------------
FastAPI router for triggering pattern learning and querying the summary.

Endpoints:
    POST /learning/refresh  — Run LearningAgent, upsert Pattern rows
    GET  /learning/summary  — Return preferred category, severity, confidence
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from agents.learning_agent import LearningAgent
from database.database import get_db
from database.models import Pattern

router = APIRouter(prefix="/learning", tags=["Learning"])


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------

class RefreshResponse(BaseModel):
    """Response returned after a successful pattern refresh.

    Attributes:
        message:           Human-readable confirmation.
        patterns_upserted: Number of Pattern rows inserted or updated.
        preferred_category: Category dimension winner after refresh.
        preferred_severity: Severity dimension winner after refresh.
        total_accepted:    Number of accepted feedback rows processed.
        total_rejected:    Number of rejected feedback rows processed.
    """

    message: str
    patterns_upserted: int
    preferred_category: str
    preferred_severity: str
    total_accepted: int
    total_rejected: int


class LearningSummary(BaseModel):
    """Aggregated pattern insights from the Pattern table.

    Attributes:
        preferred_category: Pattern name with the highest net score
                            among ``pattern_type="category"`` rows.
        preferred_severity: Pattern name with the highest net score
                            among ``pattern_type="severity"`` rows.
        overall_confidence: Score-weighted average confidence across
                            all Pattern rows. Range ``[0.0, 1.0]``.
    """

    preferred_category: str
    preferred_severity: str
    overall_confidence: float


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _top_pattern(db: Session, pattern_type: str) -> str:
    """Return the pattern_name with the highest total score for *pattern_type*.

    Args:
        db:           Active database session.
        pattern_type: ``"category"`` or ``"severity"``.

    Returns:
        The winning pattern name, or ``"N/A"`` if no rows exist.
    """
    result = (
        db.query(Pattern.pattern_name, func.sum(Pattern.score).label("total"))
        .filter(Pattern.pattern_type == pattern_type)
        .group_by(Pattern.pattern_name)
        .order_by(func.sum(Pattern.score).desc())
        .first()
    )
    return result[0] if result else "N/A"


def _weighted_confidence(db: Session) -> float:
    """Compute the score-weighted average confidence across all Pattern rows.

    Formula: ``sum(score × confidence) / sum(score)``

    Args:
        db: Active database session.

    Returns:
        Weighted confidence in ``[0.0, 1.0]``, or ``0.0`` if table is empty.
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

@router.post(
    "/refresh",
    summary="Refresh learned patterns",
    response_description="Confirmation that Pattern rows were updated.",
    response_model=RefreshResponse,
)
def refresh_patterns(db: Session = Depends(get_db)) -> RefreshResponse:
    """Trigger the LearningAgent to reanalyse all feedback and upsert Patterns.

    Reads every :class:`Feedback` row, parses the linked :class:`Review`
    response JSON, tallies category and severity occurrences, then
    inserts or updates one :class:`Pattern` row per ``(type, name)`` pair.

    Args:
        db: Injected database session.

    Returns:
        :class:`RefreshResponse` with a success message and learning stats.
    """
    agent = LearningAgent(db=db)
    summary = agent.learn()
    db.commit()

    return RefreshResponse(
        message="Patterns updated successfully.",
        patterns_upserted=summary["patterns_upserted"],
        preferred_category=summary["preferred_category"],
        preferred_severity=summary["preferred_severity"],
        total_accepted=summary["total_accepted"],
        total_rejected=summary["total_rejected"],
    )


@router.get(
    "/summary",
    summary="Learning summary",
    response_description="Preferred category, severity, and overall confidence.",
    response_model=LearningSummary,
)
def learning_summary(db: Session = Depends(get_db)) -> LearningSummary:
    """Return aggregated insights from the current Pattern table.

    Does **not** re-run learning — call ``POST /learning/refresh`` first
    to update the patterns, then use this endpoint to read them.

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
        :class:`LearningSummary` with the three computed values.
    """
    return LearningSummary(
        preferred_category=_top_pattern(db, "category"),
        preferred_severity=_top_pattern(db, "severity"),
        overall_confidence=_weighted_confidence(db),
    )
