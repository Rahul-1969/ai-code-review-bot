"""
review_routes.py
----------------
FastAPI router exposing the AI code review pipeline via HTTP endpoints.
Persists every review result to the database and returns the assigned review_id.
"""

import json

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from agents.review_pipeline import ReviewPipeline
from auth.dependencies import get_current_user
from database.database import get_db
from database.models import Review
from models.user_model import User

router = APIRouter(prefix="/review", tags=["Code Review"])


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class CodeRequest(BaseModel):
    """Request body for the /analyze endpoint.

    Attributes:
        code: Raw Python source code to be reviewed.
    """

    code: str = Field(
        ...,
        min_length=1,
        description="Python source code to analyze.",
        examples=["def hello():\n    print('hello world')"],
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post(
    "/analyze",
    summary="Analyze Python code",
    description=(
        "Runs the full review pipeline on the submitted Python source code. "
        "Persists the result to the database and returns the assigned review_id "
        "alongside AST structure, pylint/bandit findings, and Gemini AI review."
    ),
    response_description=(
        "review_id of the persisted record plus the full code review report."
    ),
)
def analyze_code(
    request: CodeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Run the complete code review pipeline and persist the result.

    Steps:
        1. Runs :class:`ReviewPipeline` (ingestion → static analysis → Gemini).
        2. Serialises the result to JSON and writes a :class:`Review` row.
        3. Returns ``review_id`` plus the full result so the caller can
           immediately reference the record for feedback submission.

    Args:
        request: A :class:`CodeRequest` body containing the Python source code.
        db:      Injected database session.
        current_user: The authenticated user making the request.

    Returns:
        On success::

            {
                "review_id": <int>,
                "result": {
                    "structure":       {"functions": [...], "classes": [...], "imports": [...]},
                    "static_analysis": {"pylint": [...], "bandit": [...]},
                    "ai_review":       {"issues": [...]}
                }
            }

        On pipeline failure the ``result`` dict will contain an ``"error"`` key;
        the :class:`Review` row is still persisted so the failure is traceable.
    """
    if not request.code.strip():
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Code payload cannot be empty"
        )

    pipeline = ReviewPipeline()
    result = pipeline.run(request.code)

    # Persist to the database regardless of pipeline success / failure
    review = Review(
        code=request.code,
        response=json.dumps(result),
        user_id=current_user.id,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return {
        "review_id": review.id,
        "result": result,
    }
