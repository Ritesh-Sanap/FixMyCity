from pydantic import BaseModel
from typing import Optional, List, Any
from datetime import datetime


class ComplaintCreate(BaseModel):
    category: str
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    ward: Optional[str] = None


class ComplaintResponse(BaseModel):
    id: str
    complaint_number: str
    category: str
    description: Optional[str]
    image_url: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    address: Optional[str]
    ward: Optional[str]
    is_duplicate: bool
    civic_issue_id: Optional[str]
    submitted_at: datetime

    class Config:
        from_attributes = True


class SubmitComplaintResponse(BaseModel):
    complaint: ComplaintResponse
    civic_issue_id: str
    civic_issue_number: str
    is_duplicate: bool
    duplicate_info: Optional[dict]
    ai_classification: dict
    priority: str
    priority_score: float
    priority_reasons: List[str]
    department: Optional[str]
    message: str


class CivicIssueSummary(BaseModel):
    id: str
    issue_number: str
    category: str
    title: str
    latitude: Optional[float]
    longitude: Optional[float]
    address: Optional[str]
    ward: Optional[str]
    severity: str
    priority: str
    priority_score: float
    status: str
    report_count: int
    department_name: Optional[str]
    first_reported_at: datetime
    ai_confidence: Optional[float]
    ai_is_mock: Optional[int]

    class Config:
        from_attributes = True


class StatusHistoryItem(BaseModel):
    from_status: Optional[str]
    to_status: str
    notes: Optional[str]
    changed_at: datetime

    class Config:
        from_attributes = True


class CivicIssueDetail(CivicIssueSummary):
    description: Optional[str]
    image_url: Optional[str]
    priority_reasons: Optional[List[str]]
    ai_confidence: Optional[float]
    status_history: List[StatusHistoryItem] = []
    assigned_officer_name: Optional[str] = None

    class Config:
        from_attributes = True


class StatusUpdateRequest(BaseModel):
    status: str
    notes: Optional[str] = None


class AssignRequest(BaseModel):
    officer_id: str
    notes: Optional[str] = None


class VerificationRequest(BaseModel):
    is_fixed: bool
    comment: Optional[str] = None
