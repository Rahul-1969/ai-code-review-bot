"""
init_db.py
----------
Database initialisation script for the AI Code Review Bot.

Imports all ORM models so their metadata is registered on ``Base``
before calling ``create_all()``.  Run this once at deployment time or
at application startup to ensure all tables exist.

Usage:
    cd backend
    python -m database.init_db
"""

from database.database import Base, engine

# Import all models so their tables are registered on Base.metadata
# before create_all() is called.  Missing imports here = missing tables.
import database.models  # noqa: F401
import models.user_model  # noqa: F401
import models.repository_scan_model  # noqa: F401


def init_db() -> None:
    """Create all database tables that do not yet exist.

    Uses ``Base.metadata.create_all()`` which is safe to call repeatedly —
    it skips tables that are already present and never drops existing data.

    Raises:
        sqlalchemy.exc.SQLAlchemyError: If the database is unreachable or
            a schema conflict prevents table creation.
    """
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
