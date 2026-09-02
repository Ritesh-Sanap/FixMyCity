from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class CitizenVerification(Base):
    __tablename__ = "citizen_verifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    civic_issue_id = Column(String, ForeignKey("civic_issues.id"), nullable=False)
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    is_fixed = Column(Boolean, nullable=False)  # True=YES FIXED, False=STILL EXISTS
    comment = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    civic_issue = relationship("CivicIssue", back_populates="verifications")
    complaint = relationship("Complaint", back_populates="verification")
    user = relationship("User", back_populates="verifications")
