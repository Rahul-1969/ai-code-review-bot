from fastapi import APIRouter
from celery.result import AsyncResult

from tasks.celery_app import celery_app

router = APIRouter(prefix="/tasks", tags=["tasks"])

EAGER_RESULTS = {}

@router.get("/{task_id}")
def get_task_status(task_id: str):
    if task_id in EAGER_RESULTS:
        data = EAGER_RESULTS[task_id]
        response = {
            "task_id": task_id,
            "status": data["status"]
        }
        if data["status"] == "SUCCESS":
            response["result"] = data["result"]
        else:
            response["error"] = data["result"]
        return response

    result = AsyncResult(task_id, app=celery_app)
    response = {
        "task_id": task_id,
        "status": result.status
    }

    if result.status == "SUCCESS":
        response["result"] = result.result
    elif result.status == "FAILURE":
        response["error"] = str(result.result)

    return response

@router.post("/{task_id}/stop")
def stop_task(task_id: str):
    """
    Revokes a celery task.
    terminate=True kills the worker process executing it if it's already started.
    """
    if task_id in EAGER_RESULTS:
        EAGER_RESULTS[task_id]["status"] = "REVOKED"
        return {"message": f"Eager task {task_id} revoked."}

    celery_app.control.revoke(task_id, terminate=True, signal='SIGTERM')
    return {"message": f"Task {task_id} stop signal sent."}
