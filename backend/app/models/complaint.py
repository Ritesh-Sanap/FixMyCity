from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # Short human-readable ID e.g. FMC-2026-0001
    complaint_number = Column(String(20), unique=True, nullable=False)

    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    civic_issue_id = Column(String, ForeignKey("civic_issues.id"), nullable=True)

    category = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    image_path = Column(String(500), nullable=True)
    image_url = Column(String(500), nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String(500), nullable=True)
    ward = Column(String(50), nullable=True)

    is_duplicate = Column(Boolean, default=False)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="complaints", foreign_keys=[user_id])
    civic_issue = relationship("CivicIssue", back_populates="complaints")
    verification = relationship("CitizenVerification", back_populates="complaint", uselist=False)
