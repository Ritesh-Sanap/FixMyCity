from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User, UserRole
from app.models.complaint import Complaint
from app.models.civic_issue import CivicIssue, IssueStatus
from app.models.prediction import Prediction
from app.schemas.dashboard import DashboardStats, MapIssue, PredictionResponse
from app.dependencies import require_officer

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db),
):
    issues = db.query(CivicIssue).all()
    total_complaints = db.query(Complaint).count()
    total_citizens = db.query(User).filter(User.role == UserRole.citizen).count()

    def count_by(attr, val):
        return sum(1 for i in issues if getattr(i, attr).value == val)

    pending_statuses = {"submitted", "ai_verified", "assigned", "work_started", "reopened"}
    pending = sum(1 for i in issues if i.status.value in pending_statuses)

    return DashboardStats(
        total_issues=len(issues),
        critical=count_by("priority", "critical"),
        high=count_by("priority", "high"),
        medium=count_by("priority", "medium"),
        low=count_by("priority", "low"),
        pending=pending,
        resolved=count_by("status", "resolved"),
        closed=count_by("status", "closed"),
        reopened=count_by("status", "reopened"),
        total_complaints=total_complaints,
        total_citizens=total_citizens,
    )


@router.get("/map-data", response_model=List[MapIssue])
def get_map_data(
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db),
):
    from app.models.department import Department
    issues = db.query(CivicIssue).filter(
        CivicIssue.latitude.isnot(None),
        CivicIssue.longitude.isnot(None),
    ).all()

    result = []
    for issue in issues:
        dept_name = None
        if issue.department_id:
            dept = db.query(Department).filter(Department.id == issue.department_id).first()
            dept_name = dept.name if dept else None
        result.append(MapIssue(
            id=issue.id,
            issue_number=issue.issue_number,
            category=issue.category,
            title=issue.title,
            latitude=issue.latitude,
            longitude=issue.longitude,
            severity=issue.severity.value,
            priority=issue.priority.value,
            status=issue.status.value,
            report_count=issue.report_count,
            department_name=dept_name,
        ))
    return result


@router.get("/officers")
def get_officers(
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db),
):
    officers = db.query(User).filter(User.role.in_([UserRole.officer, UserRole.admin])).all()
    return [{"id": o.id, "name": o.name, "email": o.email} for o in officers]


@router.get("/predictions", response_model=List[PredictionResponse])
def get_predictions(
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db),
):
    preds = db.query(Prediction).order_by(Prediction.risk_score.desc()).all()
    return [
        PredictionResponse(
            id=p.id,
            ward=p.ward,
            category=p.category,
            risk_score=p.risk_score,
            risk_label=p.risk_label,
            reasons=p.reasons or [],
            model_version=p.model_version,
            is_prototype=p.is_prototype,
        )
        for p in preds
    ]
