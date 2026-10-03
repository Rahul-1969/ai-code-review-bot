"""
gemini_review_agent.py
-----------------------
AI-powered code review agent using Google Gemini 2.5 Pro.

Performs a four-dimensional analysis of Python source code:
    1. Syntax   — naming, formatting, style
    2. Logic    — bugs, edge cases, exception handling
    3. Architecture — SOLID principles, duplication, maintainability
    4. Security & Performance — injections, secrets, inefficiencies
"""

import json
import re
from typing import Any

from google import genai
from google.genai import types


# ---------------------------------------------------------------------------
# Schema
# ---------------------------------------------------------------------------

ISSUE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "severity":    {"type": "string", "enum": ["critical", "high", "medium", "low", "info"]},
        "category":    {"type": "string", "enum": ["syntax", "logic", "architecture", "security", "performance"]},
        "line_number": {"type": "integer"},
        "issue":       {"type": "string"},
        "explanation": {"type": "string"},
        "suggestion":  {"type": "string"},
    },
    "required": ["severity", "category", "line_number", "issue", "explanation", "suggestion"],
}

REVIEW_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "issues": {
            "type": "array",
            "items": ISSUE_SCHEMA,
        }
    },
    "required": ["issues"],
}


# ---------------------------------------------------------------------------
# Prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are an expert Python code reviewer. Analyze the submitted code across \
four dimensions and return ONLY a valid JSON object — no markdown, no prose.

Dimensions:
1. Syntax      — naming conventions, formatting, PEP 8, style
2. Logic       — bugs, edge cases, unhandled exceptions, incorrect control flow
3. Architecture — SOLID violations, code duplication, poor abstractions, maintainability
4. Security & Performance — SQL injection, hardcoded secrets, shell injection, \
   weak cryptography, N+1 queries, inefficient loops

Return format (strict JSON, no extra text):
{
  "issues": [
    {
      "severity":    "critical | high | medium | low | info",
      "category":    "syntax | logic | architecture | security | performance",
      "line_number": <integer>,
      "issue":       "<short title>",
      "explanation": "<detailed explanation>",
      "suggestion":  "<actionable fix>"
    }
  ]
}

If no issues are found, return: {"issues": []}
"""


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------

class GeminiReviewAgent:
    """Uses Google Gemini 2.5 Pro to perform AI-powered code review.

    Args:
        api_key: A valid Google Gemini API key.

    Example::

        agent = GeminiReviewAgent(api_key="YOUR_KEY")
        result = agent.review("def foo(x):\\n    return x/0")
    """

    MODEL = "gemini-2.5-flash"

    def __init__(self, api_key: str) -> None:
        self._client = genai.Client(api_key=api_key)

    def review(self, code: str) -> dict[str, list[dict]]:
        """Send code to Gemini for a structured four-dimensional review.

        Args:
            code: Python source code to analyze.

        Returns:
            A dict with a single ``"issues"`` key containing a list of
            findings. Each finding has the shape::

                {
                    "severity":    str,   # critical | high | medium | low | info
                    "category":    str,   # syntax | logic | architecture | security | performance
                    "line_number": int,
                    "issue":       str,   # short title
                    "explanation": str,   # detailed explanation
                    "suggestion":  str    # actionable fix
                }

            On any failure (API error, JSON parse error) returns::

                {"issues": []}
        """
        prompt = f"Review the following Python code:\n\n```python\n{code}\n```"

        try:
            response = self._client.models.generate_content(
                model=self.MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    response_mime_type="application/json",
                    response_schema=REVIEW_SCHEMA,
                    temperature=0.2,   # low temp → deterministic, consistent reviews
                ),
            )

            return self._parse_response(response.text)

        except Exception as exc:  # noqa: BLE001
            return {"issues": [], "error": str(exc)}

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _parse_response(self, raw: str) -> dict[str, list[dict]]:
        """Parse Gemini's JSON response defensively.

        Strips markdown code fences if present, then attempts JSON decode.
        Returns ``{"issues": []}`` if parsing fails for any reason.
        """
        if not raw or not raw.strip():
            return {"issues": []}

        # Strip optional ```json ... ``` fences
        cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.MULTILINE)

        try:
            data = json.loads(cleaned)
            if isinstance(data, dict) and "issues" in data:
                return data
            return {"issues": []}
        except json.JSONDecodeError:
            return {"issues": []}


# ---------------------------------------------------------------------------
# Example usage
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import os
    import sys

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("ERROR: Set the GEMINI_API_KEY environment variable first.")
        sys.exit(1)

    sample_code = '''
import os
import subprocess
import hashlib

DB_PASSWORD = "admin123"   # hardcoded secret

def get_user(user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"  # SQL injection
    os.system(query)                                      # dangerous

def hash_data(data):
    return hashlib.md5(data.encode()).hexdigest()         # weak hash

def divide(a, b):
    return a / b                                          # ZeroDivisionError

class UserManager:
    def do_a(self): pass
    def do_b(self): pass
    def do_c(self): pass
    def do_d(self): pass
    def do_e(self): pass   # god class / no real responsibility
'''

    agent = GeminiReviewAgent(api_key=api_key)
    result = agent.review(sample_code)

    print(f"Found {len(result['issues'])} issue(s):\n")
    for i, issue in enumerate(result["issues"], 1):
        print(
            f"[{i}] [{issue['severity'].upper():8}] [{issue['category']:14}] "
            f"line {issue['line_number']:>3} — {issue['issue']}"
        )
        print(f"      Explanation : {issue['explanation']}")
        print(f"      Suggestion  : {issue['suggestion']}")
        print()
