import logging
from typing import Any, Dict

from fastapi import APIRouter, BackgroundTasks, Request, status
from fastapi.responses import JSONResponse

from github_integration.webhook_handler import process_webhook_payload

logger = logging.getLogger(__name__)

# Maintain our /github prefix structure for routing consistency
router = APIRouter(prefix="/github", tags=["GitHub Webhooks"])


@router.post("/webhook")
async def github_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Ingests native GitHub webhook POST requests.

    Crucially, because GitHub enforces strict timeouts (typically < 10 seconds) on
    webhook delivery acknowledgments, and our LLM Static Analysis pipeline can take
    minutes depending on repository scale, we immediately offload the execution
    to FastAPI's native BackgroundTasks engine and instantly return an HTTP 202.
    """
    try:
        payload: Dict[str, Any] = await request.json()
    except Exception as e:
        logger.error(f"Failed to parse GitHub webhook JSON: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"message": "Invalid or missing JSON payload"}
        )

    # Check if it's a ping event (GitHub sends this upon webhook creation)
    if "zen" in payload and "hook_id" in payload:
        logger.info(f"Received GitHub webhook ping test (hook_id: {payload['hook_id']}). Responding cleanly.")
        return {"status": "pong", "message": "Ping acknowledged"}

    # Offload the heavy pipeline execution out of the current synchronous HTTP thread
    background_tasks.add_task(process_webhook_payload, payload)

    # Immediately acknowledge receipt so GitHub does not flag the webhook as failing
    return JSONResponse(
        status_code=status.HTTP_202_ACCEPTED,
        content={"status": "accepted", "message": "Webhook payload received and queued for background processing."}
    )
