from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from auth.dependencies import get_current_user
from github_integration.pr_reviewer import review_pull_request
from models.user_model import User

router = APIRouter(prefix="/github", tags=["GitHub Integration"])


class PRReviewRequest(BaseModel):
    """Payload for initiating an AI review on a specific Pull Request."""
    repo_name: str
    pr_number: int


@router.post("/pr-review")
def analyze_github_pull_request(
    request: PRReviewRequest,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Connects to the GitHub API, retrieves a specific Pull Request,
    and natively streams any modified Python files directly through
    the AI Review pipeline.

    Protected Route: Requires a valid JWT bearer token.
    """
    if not request.repo_name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="repo_name cannot be empty"
        )

    if request.pr_number <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="pr_number must be a positive integer"
        )

    try:
        # Dispatch to the PyGithub execution engine
        results = review_pull_request(
            repo_name=request.repo_name.strip(),
            pr_number=request.pr_number
        )
        return results

    except ValueError as e:
        # Safely convert known repository or PR lookup failures directly into standard HTTP 400s
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        # Bubble up completely unhandled execution anomalies as HTTP 500s
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred during Pull Request analysis: {str(e)}"
        )
