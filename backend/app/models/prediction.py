from sqlalchemy import Column, String, Float, DateTime, JSON
from app.database import Base
import uuid
from datetime import datetime


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ward = Column(String(50), nullable=False)
    category = Column(String(50), nullable=False)
    risk_score = Column(Float, nullable=False)  # 0.0 - 1.0
    risk_label = Column(String(20), nullable=False)  # low/medium/high/critical
    reasons = Column(JSON, default=list)
    generated_at = Column(DateTime, default=datetime.utcnow)
    model_version = Column(String(50), default="baseline-v1")
    is_prototype = Column(String(5), default="true")  # Always label prototype predictions
