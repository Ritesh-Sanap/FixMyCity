from sqlalchemy import Column, String, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime
import enum


class UserRole(str, enum.Enum):
    citizen = "citizen"
    officer = "officer"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    phone = Column(String(20), unique=True, nullable=True)
    email = Column(String(200), unique=True, nullable=True)
    password_hash = Column(String(256), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.citizen, nullable=False)
    ward = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    complaints = relationship("Complaint", back_populates="user", foreign_keys="Complaint.user_id")
    assignments = relationship("Assignment", back_populates="officer", foreign_keys="Assignment.officer_id")
    verifications = relationship("CitizenVerification", back_populates="user")
