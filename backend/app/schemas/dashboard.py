from pydantic import BaseModel
from typing import Optional, List


class DashboardStats(BaseModel):
    total_issues: int
    critical: int
    high: int
    medium: int
    low: int
    pending: int
    resolved: int
    closed: int
    reopened: int
    total_complaints: int
    total_citizens: int


class MapIssue(BaseModel):
    id: str
    issue_number: str
    category: str
    title: str
    latitude: Optional[float]
    longitude: Optional[float]
    severity: str
    priority: str
    status: str
    report_count: int
    department_name: Optional[str]

    class Config:
        from_attributes = True


class PredictionResponse(BaseModel):
    id: str
    ward: str
    category: str
    risk_score: float
    risk_label: str
    reasons: List[str]
    model_version: str
    is_prototype: str
    disclaimer: str = (
        "⚠️ PROTOTYPE PREDICTION — Generated using sample/synthetic data. "
        "Not based on official government records."
    )
