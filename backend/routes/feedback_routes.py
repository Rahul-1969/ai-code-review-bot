"""
feedback_routes.py
------------------
FastAPI router for developer feedback on code reviews.

Endpoints:
    POST /feedback/accept  — Accept a review (creates Feedback row)
    POST /feedback/reject  — Reject a review with a reason
    GET  /feedback/        — List all feedback records
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database.database import get_db
from database.models import Feedback, Review

router = APIRouter(prefix="/feedback", tags=["Feedback"])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class AcceptRequest(BaseModel):
    """Request body for accepting a review.

    Attributes:
        review_id: Primary key of the :class:`Review` to accept.
    """

    review_id: int = Field(..., gt=0, description="ID of the review to accept.")


class RejectRequest(BaseModel):
    """Request body for rejecting a review.

    Attributes:
        review_id: Primary key of the :class:`Review` to reject.
        reason:    Human-readable explanation for the rejection.
    """

    review_id: int = Field(..., gt=0, description="ID of the review to reject.")
    reason: str = Field(
        ...,
        min_length=1,
        description="Explanation for why the review is being rejected.",
    )


class FeedbackResponse(BaseModel):
    """Serialised representation of a :class:`Feedback` row.

    Attributes:
        id:        Primary key of the feedback record.
        review_id: Foreign key referencing the parent review.
        accepted:  ``True`` if accepted, ``False`` if rejected.
        reason:    Rejection reason (empty string for acceptances).
        timestamp: UTC datetime the feedback was recorded.
    """

    id: int
    review_id: int
    accepted: bool
    reason: str
    timestamp: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _get_review_or_404(review_id: int, db: Session) -> Review:
    """Fetch a :class:`Review` by primary key or raise HTTP 404.

    Args:
        review_id: The review's primary key.
        db:        Active database session.

    Returns:
        The :class:`Review` ORM instance.

    Raises:
        HTTPException: 404 if the review does not exist.
    """
    review = db.get(Review, review_id)
    if review is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Review with id={review_id} not found.",
        )
    return review


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/accept",
    status_code=status.HTTP_201_CREATED,
    summary="Accept a code review",
    response_description="Confirmation that the acceptance was recorded.",
)
def accept_review(
    request: AcceptRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Record a developer's acceptance of a code review.

    Args:
        request: Contains the ``review_id`` to accept.
        db:      Injected database session.

    Returns:
        A success message and the id of the created feedback record.

    Raises:
        HTTPException: 404 if the referenced review does not exist.
    """
    _get_review_or_404(request.review_id, db)

    feedback = Feedback(
        review_id=request.review_id,
        accepted=True,
        reason="",
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return {
        "message": "Review accepted successfully.",
        "feedback_id": feedback.id,
        "review_id": feedback.review_id,
        "accepted": feedback.accepted,
    }


@router.post(
    "/reject",
    status_code=status.HTTP_201_CREATED,
    summary="Reject a code review",
    response_description="Confirmation that the rejection was recorded.",
)
def reject_review(
    request: RejectRequest,
    db: Session = Depends(get_db),
) -> dict:
    """Record a developer's rejection of a code review with a reason.

    Args:
        request: Contains the ``review_id`` and ``reason`` for rejection.
        db:      Injected database session.

    Returns:
        A success message and the id of the created feedback record.

    Raises:
        HTTPException: 404 if the referenced review does not exist.
    """
    _get_review_or_404(request.review_id, db)

    feedback = Feedback(
        review_id=request.review_id,
        accepted=False,
        reason=request.reason,
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)

    return {
        "message": "Review rejected successfully.",
        "feedback_id": feedback.id,
        "review_id": feedback.review_id,
        "accepted": feedback.accepted,
        "reason": feedback.reason,
    }


@router.get(
    "/",
    summary="List all feedback",
    response_description="All feedback records sorted by most recent first.",
    response_model=list[FeedbackResponse],
)
def list_feedback(
    db: Session = Depends(get_db),
) -> list[Feedback]:
    """Retrieve all feedback records ordered by most recent first.

    Args:
        db: Injected database session.

    Returns:
        List of :class:`FeedbackResponse` objects.
    """
    return (
        db.query(Feedback)
        .order_by(Feedback.timestamp.desc())
        .all()
    )
