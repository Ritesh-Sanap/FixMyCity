from sqlalchemy import Column, String, JSON
from sqlalchemy.orm import relationship
from app.database import Base
import uuid


class Department(Base):
    __tablename__ = "departments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False)
    contact_email = Column(String(200), nullable=True)
    head_officer = Column(String(100), nullable=True)
    # List of categories this dept handles
    category_mapping = Column(JSON, default=list)

    # Relationships
    civic_issues = relationship("CivicIssue", back_populates="department")
