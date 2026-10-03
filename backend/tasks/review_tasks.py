import asyncio
import logging
import os
import tempfile
from typing import Any, Dict

import git
from celery.exceptions import Ignore

from agents.review_pipeline import ReviewPipeline
from tasks.celery_app import celery_app

logger = logging.getLogger(__name__)


def _send_progress(task_id: str, payload: dict):
    """Helper to synchronously send async websocket messages."""
    try:
        if task_id:
            from websocket_manager.connection_manager import manager
            if manager.main_loop and manager.main_loop.is_running():
                asyncio.run_coroutine_threadsafe(manager.send_progress(task_id, payload), manager.main_loop)
            else:
                asyncio.run(manager.send_progress(task_id, payload))
    except Exception as e:
        logger.error(f"Failed to emit websocket progress: {e}")


@celery_app.task(bind=True, name="tasks.review_tasks.analyze_repository_task", max_retries=3)
def analyze_repository_task(self, repo_url: str, user_id: int) -> Dict[str, Any]:
    """
    A long-running Celery background task that securely clones a remote repository,
    iterates over all Python files, and analyzes them sequentially with the LLM pipeline.

    Args:
        repo_url (str): The HTTP/SSH URL of the target GitHub repository.
        user_id (int): The ID of the user requesting the scan.

    Returns:
        dict: The structured JSON results extracted from the AI pipeline.
    """
    task_id = str(self.request.id)

    _send_progress(task_id, {
        "progress": 10,
        "status": "Cloning repository..."
    })

    logger.info(f"Starting Celery background analysis task for repository: {repo_url}")

    try:
        repo_name = repo_url.rstrip("/").split("/")[-1]
        if repo_name.endswith(".git"):
            repo_name = repo_name[:-4]

        result: Dict[str, Any] = {
            "repo_name": repo_name,
            "total_files": 0,
            "analyzed_files": []
        }

        pipeline = ReviewPipeline()

        with tempfile.TemporaryDirectory() as temp_dir:
            try:
                git.Repo.clone_from(repo_url, temp_dir, depth=1)
            except git.exc.GitCommandError as e:
                raise ValueError(f"Invalid repository or unable to clone: {repo_url}")

            _send_progress(task_id, {
                "progress": 30,
                "status": "Repository cloned"
            })

            _send_progress(task_id, {
                "progress": 40,
                "status": "Starting analysis"
            })

            py_files = []
            for root, dirs, files in os.walk(temp_dir):
                if '.git' in dirs:
                    dirs.remove('.git')
                for file_name in files:
                    if file_name.endswith('.py'):
                        py_files.append(os.path.join(root, file_name))

            total_py_files = len(py_files)

            for idx, file_path in enumerate(py_files):
                file_name = os.path.basename(file_path)

                if total_py_files > 0:
                    current_progress = 40 + int(50 * (idx / total_py_files))
                else:
                    current_progress = 40

                _send_progress(task_id, {
                    "progress": current_progress,
                    "status": f"Analyzing {file_name}"
                })

                result["total_files"] += 1
                rel_path = os.path.relpath(file_path, temp_dir).replace("\\", "/")

                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    analysis_result = pipeline.run(content)
                    result["analyzed_files"].append({
                        "path": rel_path,
                        "result": analysis_result
                    })
                except Exception as file_err:
                    logger.error(f"Error analyzing file {rel_path}: {str(file_err)}")

        _send_progress(task_id, {
            "progress": 100,
            "status": "Completed"
        })
        logger.info(f"Successfully completed background analysis for {repo_url}.")

        # Save the results to the database
        total_issues = 0
        critical_issues = 0
        security_issues = 0

        for file_data in result["analyzed_files"]:
            ai_issues = file_data.get("result", {}).get("ai_review", {}).get("issues", [])
            bandit_issues = file_data.get("result", {}).get("static_analysis", {}).get("bandit", [])

            total_issues += len(ai_issues) + len(bandit_issues)
            critical_issues += sum(1 for iss in ai_issues if iss.get("severity", "").lower() == "critical")
            security_issues += len(bandit_issues)

        import json
        from database.database import SessionLocal
        from models.repository_scan_model import RepositoryScan

        db = SessionLocal()
        try:
            scan = RepositoryScan(
                user_id=user_id,
                repo_name=repo_name,
                repo_url=repo_url,
                total_files=result["total_files"],
                total_issues=total_issues,
                critical_issues=critical_issues,
                security_issues=security_issues,
                status="SUCCESS",
                summary=json.dumps(result)
            )
            db.add(scan)
            db.commit()
        except Exception as db_err:
            logger.error(f"Failed to save repository scan to database: {str(db_err)}")
        finally:
            db.close()

        return result

    except ValueError as e:
        _send_progress(task_id, {
            "progress": 100,
            "status": f"Failed: {str(e)}"
        })
        logger.error(f"Validation or lookup error during repository scan for {repo_url}: {str(e)}")
        self.update_state(state="FAILURE", meta={"exc_type": "ValueError", "exc_message": str(e)})
        raise Ignore()

    except Exception as e:
        _send_progress(task_id, {
            "progress": 100,
            "status": f"Failed: {str(e)}"
        })
        logger.error(f"Unexpected architectural failure during repository scan for {repo_url}: {str(e)}")
        try:
            retry_delay = 60 * (2 ** self.request.retries)
            logger.warning(f"Transient error. Retrying task in {retry_delay} seconds... (Attempt {self.request.retries + 1}/{self.max_retries})")
            raise self.retry(exc=e, countdown=retry_delay)
        except self.MaxRetriesExceededError:
            logger.critical(f"Max retries exceeded for {repo_url}. Task definitively failed.")
            self.update_state(state="FAILURE", meta={"exc_type": type(e).__name__, "exc_message": str(e)})
            raise Ignore()
