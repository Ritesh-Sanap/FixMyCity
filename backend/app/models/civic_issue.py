from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Text, Enum, JSON
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime
import enum


class SeverityLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class PriorityLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"


class IssueStatus(str, enum.Enum):
    submitted = "submitted"
    ai_verified = "ai_verified"
    assigned = "assigned"
    work_started = "work_started"
    resolved = "resolved"
    closed = "closed"
    reopened = "reopened"


class CivicIssue(Base):
    __tablename__ = "civic_issues"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    issue_number = Column(String(20), unique=True, nullable=False)

    category = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    image_path = Column(String(500), nullable=True)
    image_url = Column(String(500), nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String(500), nullable=True)
    ward = Column(String(50), nullable=True)

    severity = Column(Enum(SeverityLevel), default=SeverityLevel.medium)
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.medium)
    priority_score = Column(Float, default=0.0)
    priority_reasons = Column(JSON, default=list)

    status = Column(Enum(IssueStatus), default=IssueStatus.submitted)
    department_id = Column(String, ForeignKey("departments.id"), nullable=True)
    report_count = Column(Integer, default=1)

    # AI classification metadata
    ai_confidence = Column(Float, nullable=True)
    ai_is_mock = Column(Integer, default=1)  # 1=mock/prototype, 0=real model

    first_reported_at = Column(DateTime, default=datetime.utcnow)
    last_updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    complaints = relationship("Complaint", back_populates="civic_issue")
    department = relationship("Department", back_populates="civic_issues")
    assignments = relationship("Assignment", back_populates="civic_issue")
    status_history = relationship("StatusHistory", back_populates="civic_issue", order_by="StatusHistory.changed_at")
    verifications = relationship("CitizenVerification", back_populates="civic_issue")
