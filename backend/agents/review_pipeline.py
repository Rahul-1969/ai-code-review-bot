"""
review_pipeline.py
------------------
Orchestrates the full code review pipeline by coordinating all analysis agents:

    1. CodeIngestionAgent  — AST-based structural extraction
    2. StaticAnalysisAgent — pylint + bandit static analysis
    3. GeminiReviewAgent   — AI-powered four-dimensional review (optional)
"""

import os

from dotenv import load_dotenv

from agents.gemini_review_agent import GeminiReviewAgent
from agents.ingestion_agent import CodeIngestionAgent
from agents.static_analysis_agent import StaticAnalysisAgent

# Load .env at import time so all downstream code sees the variables
load_dotenv()


class ReviewPipeline:
    """Runs a complete code review by chaining all analysis agents.

    Agents executed (in order):
        1. :class:`CodeIngestionAgent`  — extracts structural metadata via AST.
        2. :class:`StaticAnalysisAgent` — runs pylint and bandit.
        3. :class:`GeminiReviewAgent`   — AI review via Gemini 2.5 Pro
                                          (skipped gracefully if API key absent).

    Example::

        pipeline = ReviewPipeline()
        report   = pipeline.run("def foo(): pass")
    """

    def __init__(self) -> None:
        self.ingestion_agent = CodeIngestionAgent()
        self.static_agent = StaticAnalysisAgent()

        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if api_key:
            self.gemini_agent: GeminiReviewAgent | None = GeminiReviewAgent(api_key=api_key)
        else:
            self.gemini_agent = None

    def run(self, code: str) -> dict:
        """Execute the full review pipeline on the given source code.

        Steps:
            1. AST ingestion — aborts pipeline early on syntax errors.
            2. Static analysis — always runs if step 1 succeeds.
            3. AI review via Gemini — runs if ``GEMINI_API_KEY`` is set;
               failures are captured in the result but never abort the pipeline.

        Args:
            code: A string containing Python source code to review.

        Returns:
            On success::

                {
                    "structure": {
                        "functions": [...],
                        "classes":   [...],
                        "imports":   [...]
                    },
                    "static_analysis": {
                        "pylint": [...],
                        "bandit": [...]
                    },
                    "ai_review": {
                        "issues": [...]
                    }
                }

            On early syntax failure::

                {"error": "Invalid Python syntax"}

            On unexpected exception::

                {"error": "<exception message>"}
        """
        try:
            # ------------------------------------------------------------------
            # Step 1: AST ingestion
            # ------------------------------------------------------------------
            structure = self.ingestion_agent.analyze(code)

            if "error" in structure:
                return {"error": structure["error"]}

            # ------------------------------------------------------------------
            # Step 2: Static analysis
            # ------------------------------------------------------------------
            static_analysis = self.static_agent.analyze(code)

            # ------------------------------------------------------------------
            # Step 3: AI review (optional — degrades gracefully)
            # ------------------------------------------------------------------
            ai_review = self._run_gemini(code)

            return {
                "structure": structure,
                "static_analysis": static_analysis,
                "ai_review": ai_review,
            }

        except Exception as exc:  # noqa: BLE001
            return {"error": str(exc)}

    # --------------------------------------------------------------------------
    # Private helpers
    # --------------------------------------------------------------------------

    def _run_gemini(self, code: str) -> dict:
        """Invoke GeminiReviewAgent if available, degrade gracefully otherwise.

        Args:
            code: Python source code to review.

        Returns:
            The AI review dict (``{"issues": [...]}``), or a degraded response
            with an ``"error"`` key if the agent is unavailable or fails.
        """
        if self.gemini_agent is None:
            return {"issues": [], "error": "GEMINI_API_KEY not configured"}

        try:
            return self.gemini_agent.review(code)
        except Exception as exc:  # noqa: BLE001
            return {"issues": [], "error": str(exc)}


# ---------------------------------------------------------------------------
# Example usage
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import json

    sample_code = '''
import os
import subprocess
from typing import Optional

SECRET_KEY = "supersecret"

class AuthService:
    """Handles user authentication."""

    def authenticate(self, username: str, password: str) -> bool:
        cmd = f"verify {username}"
        subprocess.call(cmd, shell=True)
        return True

    async def refresh_token(self, token: str) -> Optional[str]:
        return None

def hash_password(pw: str) -> str:
    import hashlib
    return hashlib.md5(pw.encode()).hexdigest()

unused_var = 42
'''

    pipeline = ReviewPipeline()
    report = pipeline.run(sample_code)

    print(json.dumps(report, indent=2))

    print("\n=== Invalid Code Test ===")
    print(json.dumps(pipeline.run("def broken(:"), indent=2))
