"""
static_analysis_agent.py
------------------------
Static analysis agent that runs pylint and bandit on Python source code.
Uses temporary files for analysis and cleans up after itself.
"""

import json
import os
import subprocess
import tempfile
from typing import TypedDict


class Issue(TypedDict):
    """Represents a single linting or security issue."""
    type: str
    message: str
    line: int


class AnalysisResult(TypedDict):
    """Top-level result returned by StaticAnalysisAgent.analyze()."""
    pylint: list[Issue]
    bandit: list[Issue]


class StaticAnalysisAgent:
    """Runs pylint and bandit against Python source code.

    The agent writes code to a secure temporary file, invokes each tool
    as a subprocess, parses their JSON output, and deletes the temp file
    regardless of whether analysis succeeds or fails.
    """

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def analyze(self, code: str) -> AnalysisResult:
        """Analyze Python source code with pylint and bandit.

        Args:
            code: A string containing Python source code.

        Returns:
            A dict with two keys:
                - ``pylint``: list of linting issues
                - ``bandit``: list of security issues

            Each issue has the shape::

                {"type": str, "message": str, "line": int}
        """
        tmp_path = self._write_temp_file(code)
        try:
            pylint_issues = self._run_pylint(tmp_path)
            bandit_issues = self._run_bandit(tmp_path)
        finally:
            self._delete_file(tmp_path)

        return {"pylint": pylint_issues, "bandit": bandit_issues}

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _write_temp_file(self, code: str) -> str:
        """Write *code* to a named temporary .py file and return its path.

        The file is **not** deleted automatically (delete=False) so that
        subprocess tools can open it by path on all platforms.
        """
        with tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".py",
            delete=False,
            encoding="utf-8",
        ) as tmp:
            tmp.write(code)
            return tmp.name

    def _delete_file(self, path: str) -> None:
        """Remove a file from disk, silently ignoring errors."""
        try:
            os.remove(path)
        except OSError:
            pass

    # ------------------------------------------------------------------
    # Pylint
    # ------------------------------------------------------------------

    def _run_pylint(self, path: str) -> list[Issue]:
        """Run pylint on *path* and return a list of issues.

        Uses ``--output-format=json`` so results are machine-readable.
        Pylint exits with non-zero codes for warnings/errors — we treat
        those as normal and only raise on unexpected failures.
        """
        try:
            result = subprocess.run(
                [
                    "python", "-m", "pylint",
                    "--output-format=json",
                    "--disable=C0114,C0115,C0116",   # suppress missing-docstring noise
                    path,
                ],
                capture_output=True,
                text=True,
            )
            raw = result.stdout.strip()
            if not raw:
                return []

            messages: list[dict] = json.loads(raw)
            return [
                Issue(
                    type=msg.get("type", "unknown"),
                    message=msg.get("message", ""),
                    line=msg.get("line", 0),
                )
                for msg in messages
            ]

        except FileNotFoundError:
            return [Issue(type="error", message="pylint is not installed or not on PATH", line=0)]
        except json.JSONDecodeError:
            return [Issue(type="error", message="Failed to parse pylint output", line=0)]
        except Exception as exc:  # noqa: BLE001
            return [Issue(type="error", message=f"pylint error: {exc}", line=0)]

    # ------------------------------------------------------------------
    # Bandit
    # ------------------------------------------------------------------

    def _run_bandit(self, path: str) -> list[Issue]:
        """Run bandit on *path* and return a list of security issues.

        Uses ``-f json`` for machine-readable output.
        Bandit exits with code 1 when issues are found — this is normal.
        """
        try:
            result = subprocess.run(
                [
                    "python", "-m", "bandit",
                    "-f", "json",
                    "-q",        # suppress progress output
                    path,
                ],
                capture_output=True,
                text=True,
            )
            raw = result.stdout.strip()
            if not raw:
                return []

            data: dict = json.loads(raw)
            findings: list[dict] = data.get("results", [])
            return [
                Issue(
                    type=finding.get("issue_severity", "unknown"),
                    message=finding.get("issue_text", ""),
                    line=finding.get("line_number", 0),
                )
                for finding in findings
            ]

        except FileNotFoundError:
            return [Issue(type="error", message="bandit is not installed or not on PATH", line=0)]
        except json.JSONDecodeError:
            return [Issue(type="error", message="Failed to parse bandit output", line=0)]
        except Exception as exc:  # noqa: BLE001
            return [Issue(type="error", message=f"bandit error: {exc}", line=0)]


# ---------------------------------------------------------------------------
# Example usage
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    sample_code = '''
import os
import subprocess

password = "hardcoded_secret_123"   # bandit: hardcoded password

def run_command(user_input):
    # bandit: subprocess with shell=True is dangerous
    subprocess.call(user_input, shell=True)

def divide(a, b):
    return a / b                    # pylint: no zero-division guard

x=1+1                               # pylint: bad whitespace / style
'''

    agent = StaticAnalysisAgent()
    report = agent.analyze(sample_code)

    print("=== Pylint Issues ===")
    if report["pylint"]:
        for issue in report["pylint"]:
            print(f"  [{issue['type'].upper():8}] line {issue['line']:>3} — {issue['message']}")
    else:
        print("  No issues found.")

    print("\n=== Bandit Security Issues ===")
    if report["bandit"]:
        for issue in report["bandit"]:
            print(f"  [{issue['type'].upper():8}] line {issue['line']:>3} — {issue['message']}")
    else:
        print("  No issues found.")
