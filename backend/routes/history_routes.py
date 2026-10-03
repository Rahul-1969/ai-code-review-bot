import json
from typing import List, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import desc
from sqlalchemy.orm import Session

from database.database import get_db
from database.models import Review
from models.user_model import User
from auth.dependencies import get_current_user

router = APIRouter(prefix="/history", tags=["History"])

class HistoryItem(BaseModel):
    id: int
    display_id: int
    timestamp: str
    code_preview: str
    total_ai_issues: int
    critical_issues: int
    accepted_status: Optional[bool]


@router.get("/", response_model=List[HistoryItem])
def get_user_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns all reviews belonging to the authenticated user.
    Ordered by newest first.
    Includes a code preview and parsed AI issue metrics.
    """
    reviews = (
        db.query(Review)
        .filter(Review.user_id == current_user.id)
        .order_by(desc(Review.timestamp))
        .all()
    )

    result = []
    total_reviews = len(reviews)
    for index, review in enumerate(reviews):
        display_id = total_reviews - index
        total_ai_issues = 0
        critical_issues = 0

        # Parse the JSON response to calculate metrics
        if review.response:
            try:
                response_data = json.loads(review.response)
                ai_review = response_data.get("ai_review", {})
                issues = ai_review.get("issues", [])

                total_ai_issues = len(issues)
                critical_issues = sum(
                    1 for issue in issues
                    if isinstance(issue, dict) and str(issue.get("severity", "")).lower() == "critical"
                )
            except json.JSONDecodeError:
                pass  # Gracefully fallback to 0 if response isn't valid JSON

        # Determine accepted status from feedback (if any)
        accepted_status = None
        if review.feedbacks:
            # Find the most recent feedback
            latest_feedback = max(review.feedbacks, key=lambda f: f.timestamp)
            accepted_status = latest_feedback.accepted

        # Append to the final payload
        result.append(
            HistoryItem(
                id=review.id,
                display_id=display_id,
                timestamp=review.timestamp.isoformat(),
                code_preview=review.code[:100],  # Return first 100 characters for preview
                total_ai_issues=total_ai_issues,
                critical_issues=critical_issues,
                accepted_status=accepted_status,
            )
        )

    return result

class HistoryDetail(HistoryItem):
    code: str
    response: Optional[str]

@router.get("/{review_id}", response_model=HistoryDetail)
def get_review_detail(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi import HTTPException, status
    review = db.query(Review).filter(Review.id == review_id, Review.user_id == current_user.id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    total_ai_issues = 0
    critical_issues = 0
    if review.response:
        try:
            response_data = json.loads(review.response)
            ai_review = response_data.get("ai_review", {})
            issues = ai_review.get("issues", [])
            total_ai_issues = len(issues)
            critical_issues = sum(
                1 for issue in issues
                if isinstance(issue, dict) and str(issue.get("severity", "")).lower() == "critical"
            )
        except json.JSONDecodeError:
            pass

    accepted_status = None
    if review.feedbacks:
        latest_feedback = max(review.feedbacks, key=lambda f: f.timestamp)
        accepted_status = latest_feedback.accepted

    display_id = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.id <= review.id
    ).count()

    return HistoryDetail(
        id=review.id,
        display_id=display_id,
        timestamp=review.timestamp.isoformat(),
        code_preview=review.code[:100],
        total_ai_issues=total_ai_issues,
        critical_issues=critical_issues,
        accepted_status=accepted_status,
        code=review.code,
        response=review.response
    )

@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi import HTTPException, status
    review = db.query(Review).filter(Review.id == review_id, Review.user_id == current_user.id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")

    db.delete(review)
    db.commit()
    return {"message": "Review deleted successfully"}
