"""
feedback_agent.py
-----------------
Database-backed feedback agent for the AI Code Review Bot.

Replaces the previous in-memory implementation with SQLAlchemy persistence.
Every accept/reject decision is stored in the ``feedbacks`` table, and the
"last decision wins" rule is enforced by updating an existing row rather
than inserting a duplicate.
"""

from datetime import datetime, timezone

from sqlalchemy.orm import Session

from database.models import Feedback, Review


def _utcnow() -> datetime:
    """Return the current UTC time as a timezone-aware datetime."""
    return datetime.now(timezone.utc)


class FeedbackAgent:
    """Persists developer feedback on code review results using SQLAlchemy.

    All methods require a :class:`~sqlalchemy.orm.Session` so the caller
    controls the transaction boundary (e.g., the FastAPI ``get_db()``
    dependency). The agent never calls ``db.commit()`` itself — that
    responsibility belongs to the caller.

    Args:
        db: An active SQLAlchemy session.

    Example::

        agent = FeedbackAgent(db=db)
        agent.accept(review_id=1)
        agent.reject(review_id=2, reason="False positive")
        print(agent.get_feedback())
    """

    def __init__(self, db: Session) -> None:
        self._db = db

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def accept(self, review_id: int) -> dict:
        """Record or update an acceptance decision for a review.

        If a :class:`Feedback` row already exists for *review_id*,
        it is updated in-place (last decision wins). Otherwise a new
        row is inserted.

        Args:
            review_id: Primary key of the :class:`Review` to accept.

        Returns:
            Serialised :class:`Feedback` record.

        Raises:
            ValueError: If no :class:`Review` with *review_id* exists.
        """
        self._validate_review(review_id)
        feedback = self._get_or_create(review_id)

        feedback.accepted  = True
        feedback.reason    = ""
        feedback.timestamp = _utcnow()

        self._db.flush()
        return self._serialize(feedback)

    def reject(self, review_id: int, reason: str = "") -> dict:
        """Record or update a rejection decision for a review.

        If a :class:`Feedback` row already exists for *review_id*,
        it is updated in-place (last decision wins). Otherwise a new
        row is inserted.

        Args:
            review_id: Primary key of the :class:`Review` to reject.
            reason:    Human-readable explanation for the rejection.

        Returns:
            Serialised :class:`Feedback` record.

        Raises:
            ValueError: If no :class:`Review` with *review_id* exists.
        """
        self._validate_review(review_id)
        feedback = self._get_or_create(review_id)

        feedback.accepted  = False
        feedback.reason    = reason
        feedback.timestamp = _utcnow()

        self._db.flush()
        return self._serialize(feedback)

    def get_feedback(self) -> dict:
        """Return all feedback records grouped by decision.

        Returns:
            A dictionary with the shape::

                {
                    "accepted": [
                        {
                            "review_id": int,
                            "accepted":  True,
                            "reason":    str,
                            "timestamp": str   # ISO-8601 UTC
                        }, ...
                    ],
                    "rejected": [...],
                    "summary": {
                        "total_accepted": int,
                        "total_rejected": int,
                        "total":          int
                    }
                }
        """
        all_rows: list[Feedback] = (
            self._db.query(Feedback)
            .order_by(Feedback.timestamp.desc())
            .all()
        )

        accepted = [self._serialize(f) for f in all_rows if f.accepted]
        rejected = [self._serialize(f) for f in all_rows if not f.accepted]

        return {
            "accepted": accepted,
            "rejected": rejected,
            "summary": {
                "total_accepted": len(accepted),
                "total_rejected": len(rejected),
                "total":          len(all_rows),
            },
        }

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _validate_review(self, review_id: int) -> None:
        """Raise :class:`ValueError` if no :class:`Review` exists for *review_id*.

        Args:
            review_id: The review primary key to check.

        Raises:
            ValueError: If the review does not exist in the database.
        """
        exists = self._db.get(Review, review_id) is not None
        if not exists:
            raise ValueError(f"Review with id={review_id} does not exist.")

    def _get_or_create(self, review_id: int) -> Feedback:
        """Fetch an existing :class:`Feedback` row or create a new one.

        Ensures at most one feedback row per review (last decision wins).

        Args:
            review_id: Primary key of the parent review.

        Returns:
            An ORM-tracked :class:`Feedback` instance (new or existing).
        """
        feedback = (
            self._db.query(Feedback)
            .filter(Feedback.review_id == review_id)
            .first()
        )
        if feedback is None:
            feedback = Feedback(review_id=review_id, accepted=True, reason="")
            self._db.add(feedback)
        return feedback

    @staticmethod
    def _serialize(feedback: Feedback) -> dict:
        """Convert a :class:`Feedback` ORM instance to a plain dictionary.

        Args:
            feedback: The ORM instance to serialise.

        Returns:
            Plain dict with ``review_id``, ``accepted``, ``reason``,
            and ISO-8601 ``timestamp``.
        """
        ts = feedback.timestamp
        return {
            "review_id": feedback.review_id,
            "accepted":  feedback.accepted,
            "reason":    feedback.reason or "",
            "timestamp": ts.isoformat() if ts else None,
        }


# ---------------------------------------------------------------------------
# Example usage
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import json
    from database.database import SessionLocal
    from database.models import Review

    db = SessionLocal()

    # Seed a review so FK validation passes
    review = Review(code="def foo(): pass", response="{}")
    db.add(review)
    db.commit()
    db.refresh(review)
    rid = review.id
    print(f"Seeded Review id={rid}")

    agent = FeedbackAgent(db=db)

    print("\n=== Accept review ===")
    print(json.dumps(agent.accept(rid), indent=2))
    db.commit()

    print("\n=== Reject same review (last decision wins) ===")
    print(json.dumps(agent.reject(rid, reason="False positive on line 5"), indent=2))
    db.commit()

    print("\n=== Get all feedback ===")
    print(json.dumps(agent.get_feedback(), indent=2))

    print("\n=== Validate missing review ===")
    try:
        agent.accept(99999)
    except ValueError as e:
        print(f"ValueError: {e}")

    db.close()
