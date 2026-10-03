import logging
from github_integration.pr_reviewer import review_pull_request

logger = logging.getLogger(__name__)

def process_webhook_payload(payload: dict):
    # Determine the event type based on payload contents
    if "pull_request" in payload and "repository" in payload:
        repo_name = payload["repository"].get("full_name")
        pr_number = payload["pull_request"].get("number")
        action = payload.get("action")

        if action in ["opened", "synchronize"]:
            logger.info(f"Processing pull_request webhook for {repo_name} #{pr_number}")
            try:
                review_pull_request(repo_name, pr_number)
            except Exception as e:
                logger.error(f"Failed to process PR webhook: {e}")

    elif "commits" in payload and "repository" in payload:
        repo_name = payload["repository"].get("full_name")
        logger.info(f"Received push webhook for {repo_name}. Ignoring as it lacks user context needed for full scan.")
    else:
        logger.info("Received unsupported webhook event payload.")
