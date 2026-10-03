from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from auth.dependencies import get_current_user
from models.user_model import User
from tasks.review_tasks import analyze_repository_task

router = APIRouter(prefix="/github", tags=["GitHub Integration"])


class ScanRequest(BaseModel):
    """Payload for initiating a full repository scan."""
    repo_url: str


@router.post("/scan")
def scan_github_repository(
    request: ScanRequest,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Clones a remote repository, scans all Python files, and streams
    them through the AI Code Review pipeline.

    Protected Route: Requires a valid JWT bearer token.
    """
    if not request.repo_url.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="repo_url cannot be empty"
        )

    try:
        import threading
        import uuid
        task_id = str(uuid.uuid4())

        # If running locally without Redis, Celery eager mode blocks the request.
        # We spawn a thread to execute it synchronously in the background instead.
        from tasks.celery_app import celery_app
        if celery_app.conf.task_always_eager:
            def eager_worker():
                try:
                    # In eager mode, apply_async returns an EagerResult synchronously
                    # but doesn't write to the Redis backend, so we store it manually
                    res = analyze_repository_task.apply_async(args=[request.repo_url.strip(), current_user.id], task_id=task_id)
                    from routes.task_routes import EAGER_RESULTS
                    if res.state == "SUCCESS":
                        EAGER_RESULTS[task_id] = {"status": "SUCCESS", "result": res.result}
                    else:
                        EAGER_RESULTS[task_id] = {"status": "FAILURE", "result": str(res.result)}
                except Exception as e:
                    from routes.task_routes import EAGER_RESULTS
                    EAGER_RESULTS[task_id] = {"status": "FAILURE", "result": str(e)}

            threading.Thread(target=eager_worker, daemon=True).start()
        else:
            # Standard asynchronous dispatch to Redis queue
            analyze_repository_task.apply_async(args=[request.repo_url.strip(), current_user.id], task_id=task_id)

        # Return an HTTP 202 Accepted with the async task_id so the frontend can poll it later
        return JSONResponse(
            status_code=status.HTTP_202_ACCEPTED,
            content={"task_id": task_id, "message": "Repository scanning queued successfully."}
        )

    except Exception as e:
        # Catch unexpected pipeline crashes (e.g. Redis offline)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred queueing the analysis: {str(e)}"
        )
