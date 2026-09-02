"""
SOS Alert and Emergency Contact models.
New table — does not modify any existing model.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import relationship
import enum

from app.database import Base


class SOSStatus(str, enum.Enum):
    active = "active"
    cancelled = "cancelled"
    safe = "safe"


class SOSAlert(Base):
    __tablename__ = "sos_alerts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String, nullable=True)
    ward = Column(String, nullable=True)
    status = Column(SAEnum(SOSStatus), default=SOSStatus.active, nullable=False)
    note = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id])


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    relation = Column(String, nullable=True)  # e.g. "Mother", "Sister", "Friend"

    user = relationship("User", foreign_keys=[user_id])
