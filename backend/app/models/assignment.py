from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    civic_issue_id = Column(String, ForeignKey("civic_issues.id"), nullable=False)
    officer_id = Column(String, ForeignKey("users.id"), nullable=False)
    assigned_by = Column(String, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    civic_issue = relationship("CivicIssue", back_populates="assignments")
    officer = relationship("User", back_populates="assignments", foreign_keys=[officer_id])
    assigned_by_user = relationship("User", foreign_keys=[assigned_by])
