"""
learning_agent.py
-----------------
Database-backed learning agent for the AI Code Review Bot.

Reads Feedback and Review rows from SQLite, extracts patterns from the
Gemini AI review issues embedded in each review's JSON response, then
upserts Pattern rows (category + severity dimensions).

All computation uses Python's standard collections (Counter, defaultdict)
— no ML dependencies. Behaviour is fully deterministic for identical data.
"""

import json
from collections import Counter, defaultdict

from sqlalchemy.orm import Session

from database.models import Feedback, Pattern, Review


class LearningAgent:
    """Learns preferred patterns from historical feedback stored in the database.

    For every accepted / rejected :class:`Feedback` row, the agent loads
    the corresponding :class:`Review` response JSON and tallies the
    ``severity`` and ``category`` fields from the embedded Gemini
    ``ai_review.issues`` list.

    It then upserts one :class:`Pattern` row per ``(pattern_type, pattern_name)``
    pair, updating ``score`` (frequency) and ``confidence`` (acceptance rate).

    Args:
        db: An active SQLAlchemy session. The caller is responsible for
            committing after :meth:`learn` returns.

    Example::

        agent = LearningAgent(db=db)
        result = agent.learn()
        db.commit()
        print(result)
    """

    def __init__(self, db: Session) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def learn(self) -> dict:
        """Analyse all feedback, upsert Pattern rows, and return a summary.

        Steps:
            1. Load all :class:`Feedback` rows.
            2. For each feedback entry load the linked :class:`Review` and
               parse ``ai_review.issues`` from its JSON response.
            3. Tally ``severity`` and ``category`` values split by
               accept / reject decision.
            4. Upsert one :class:`Pattern` row per ``(type, name)`` pair.
            5. Return a summary dict with preferred dimensions and totals.

        Returns:
            ::

                {
                    "preferred_category": str | "N/A",
                    "preferred_severity": str | "N/A",
                    "patterns_upserted":  int,
                    "total_accepted":     int,
                    "total_rejected":     int
                }
        """
        feedbacks: list[Feedback] = self._db.query(Feedback).all()

        # Counters keyed by (pattern_type, pattern_name)
        accepted_counts: Counter  = Counter()
        rejected_counts: Counter  = Counter()

        for fb in feedbacks:
            review = self._db.get(Review, fb.review_id)
            if review is None or not review.response:
                continue

            issues = self._extract_issues(review.response)
            for issue in issues:
                for dim in ("severity", "category"):
                    val = issue.get(dim, "").strip().lower()
                    if not val:
                        continue
                    key = (dim, val)
                    if fb.accepted:
                        accepted_counts[key] += 1
                    else:
                        rejected_counts[key] += 1

        # Union of all seen keys
        all_keys: set[tuple[str, str]] = (
            set(accepted_counts.keys()) | set(rejected_counts.keys())
        )

        upserted = 0
        for pattern_type, pattern_name in sorted(all_keys):
            a = accepted_counts[(pattern_type, pattern_name)]
            r = rejected_counts[(pattern_type, pattern_name)]
            total = a + r
            confidence = round(a / total, 4) if total else 0.0

            self._upsert_pattern(
                pattern_type=pattern_type,
                pattern_name=pattern_name,
                score=total,
                confidence=confidence,
            )
            upserted += 1

        self._db.flush()

        return {
            "preferred_category": self._preferred("category", accepted_counts, rejected_counts),
            "preferred_severity": self._preferred("severity", accepted_counts, rejected_counts),
            "patterns_upserted":  upserted,
            "total_accepted":     sum(1 for f in feedbacks if f.accepted),
            "total_rejected":     sum(1 for f in feedbacks if not f.accepted),
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _extract_issues(response_json: str) -> list[dict]:
        """Parse Gemini issues from a :class:`Review` response JSON string.

        Args:
            response_json: The ``Review.response`` column value.

        Returns:
            List of issue dicts (may be empty on parse error or missing key).
        """
        try:
            data = json.loads(response_json)
            return data.get("ai_review", {}).get("issues", [])
        except (json.JSONDecodeError, AttributeError):
            return []

    def _upsert_pattern(
        self,
        pattern_type: str,
        pattern_name: str,
        score: int,
        confidence: float,
    ) -> None:
        """Insert a new Pattern row or update an existing one in-place.

        Looks up by ``(pattern_type, pattern_name)``. If found, updates
        ``score`` and ``confidence``; otherwise inserts a new row.

        Args:
            pattern_type: Dimension — ``"category"`` or ``"severity"``.
            pattern_name: The specific value (e.g. ``"security"``).
            score:        Total occurrence count (accepted + rejected).
            confidence:   Acceptance rate in ``[0.0, 1.0]``.
        """
        pattern: Pattern | None = (
            self._db.query(Pattern)
            .filter(
                Pattern.pattern_type == pattern_type,
                Pattern.pattern_name == pattern_name,
            )
            .first()
        )

        if pattern is None:
            pattern = Pattern(
                pattern_type=pattern_type,
                pattern_name=pattern_name,
                score=score,
                confidence=confidence,
            )
            self._db.add(pattern)
        else:
            pattern.score      = score
            pattern.confidence = confidence

    @staticmethod
    def _preferred(
        dimension: str,
        accepted: Counter,
        rejected: Counter,
    ) -> str:
        """Return the pattern_name with the highest net acceptance score.

        Net score = accepted_count − rejected_count for each value in
        *dimension*. Ties are broken alphabetically for determinism.

        Args:
            dimension: ``"category"`` or ``"severity"``.
            accepted:  Counter keyed by ``(type, name)`` for accepted issues.
            rejected:  Counter keyed by ``(type, name)`` for rejected issues.

        Returns:
            The winning pattern name, or ``"N/A"`` if no data exists.
        """
        net: defaultdict[str, int] = defaultdict(int)

        for (dim, name), count in accepted.items():
            if dim == dimension:
                net[name] += count

        for (dim, name), count in rejected.items():
            if dim == dimension:
                net[name] -= count

        if not net:
            return "N/A"

        # max by net score, alphabetical tiebreak
        return max(net, key=lambda k: (net[k], k))


# ---------------------------------------------------------------------------
# Example usage
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import json as _json
    from database.database import SessionLocal
    from database.models import Review, Feedback

    db = SessionLocal()

    # Seed a review that mimics a Gemini response
    mock_response = _json.dumps({
        "structure": {"functions": ["auth"], "classes": [], "imports": []},
        "static_analysis": {"pylint": [], "bandit": []},
        "ai_review": {
            "issues": [
                {"severity": "critical", "category": "security", "line_number": 5,
                 "issue": "Shell injection", "explanation": "...", "suggestion": "..."},
                {"severity": "high",     "category": "security", "line_number": 10,
                 "issue": "Hardcoded secret", "explanation": "...", "suggestion": "..."},
                {"severity": "low",      "category": "syntax",   "line_number": 2,
                 "issue": "Naming", "explanation": "...", "suggestion": "..."},
            ]
        }
    })

    review = Review(code="def auth(): pass", response=mock_response)
    db.add(review); db.commit(); db.refresh(review)

    # Accept this review
    fb_accept = Feedback(review_id=review.id, accepted=True, reason="")
    db.add(fb_accept); db.commit()

    # Seed a second review (rejected — syntax noise)
    mock_response2 = _json.dumps({
        "structure": {}, "static_analysis": {},
        "ai_review": {
            "issues": [
                {"severity": "low",  "category": "syntax",   "line_number": 1,
                 "issue": "Naming", "explanation": "...", "suggestion": "..."},
                {"severity": "info", "category": "syntax",   "line_number": 3,
                 "issue": "Style",  "explanation": "...", "suggestion": "..."},
            ]
        }
    })
    review2 = Review(code="x=1", response=mock_response2)
    db.add(review2); db.commit(); db.refresh(review2)

    fb_reject = Feedback(review_id=review2.id, accepted=False, reason="False positive")
    db.add(fb_reject); db.commit()

    # Run the learning agent
    agent = LearningAgent(db=db)
    result = agent.learn()
    db.commit()

    print("=== Learning Summary ===")
    print(_json.dumps(result, indent=2))

    print("\n=== Pattern Table ===")
    patterns = db.query(Pattern).order_by(Pattern.score.desc()).all()
    for p in patterns:
        print(f"  [{p.pattern_type:10}] {p.pattern_name:12} score={p.score} confidence={p.confidence}")

    db.close()
