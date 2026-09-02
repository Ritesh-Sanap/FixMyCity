from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    civic_issue_id = Column(String, ForeignKey("civic_issues.id"), nullable=False)
    from_status = Column(String(50), nullable=True)
    to_status = Column(String(50), nullable=False)
    changed_by = Column(String, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    changed_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    civic_issue = relationship("CivicIssue", back_populates="status_history")
    changed_by_user = relationship("User", foreign_keys=[changed_by])
