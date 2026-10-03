import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from database.database import Base

class RepositoryScan(Base):
    __tablename__ = "repository_scans"

    # EXISTING
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    # PROVEN_FROM_CROSS_MODULE_WRITER
    repo_name = Column(String)
    repo_url = Column(String)
    total_files = Column(Integer)
    total_issues = Column(Integer)
    critical_issues = Column(Integer)
    security_issues = Column(Integer)
    status = Column(String)
    summary = Column(Text)

    # RECONSTRUCTED_FROM_FRONTEND_CONTRACT / ORIGINAL_IMPLEMENTATION_UNCERTAIN
    # Do NOT claim that branch or created_at existed in the original lost model.
    # For created_at, the DateTime + UTC default is a reconstruction chosen to satisfy the observed frontend contract.
    branch = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
