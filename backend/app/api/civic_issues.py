from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.database import get_db
from app.models.user import User, UserRole
from app.models.civic_issue import CivicIssue, IssueStatus, PriorityLevel
from app.models.assignment import Assignment
from app.models.status_history import StatusHistory
from app.models.department import Department
from app.schemas.complaint import (
    CivicIssueSummary, CivicIssueDetail, StatusUpdateRequest, AssignRequest, StatusHistoryItem
)
from app.dependencies import get_current_user, require_officer

router = APIRouter(prefix="/api/civic-issues", tags=["Civic Issues"])


def _enrich_issue(issue: CivicIssue, db: Session) -> dict:
    """Build enriched dict for CivicIssueDetail."""
    dept_name = None
    if issue.department_id:
        dept = db.query(Department).filter(Department.id == issue.department_id).first()
        dept_name = dept.name if dept else None

    assigned_officer_name = None
    latest_assignment = (
        db.query(Assignment)
        .filter(Assignment.civic_issue_id == issue.id)
        .order_by(Assignment.assigned_at.desc())
        .first()
    )
    if latest_assignment:
        officer = db.query(User).filter(User.id == latest_assignment.officer_id).first()
        assigned_officer_name = officer.name if officer else None

    history_items = [
        StatusHistoryItem(
            from_status=h.from_status,
            to_status=h.to_status,
            notes=h.notes,
            changed_at=h.changed_at,
        )
        for h in issue.status_history
    ]

    return {
        **{c.name: getattr(issue, c.name) for c in issue.__table__.columns},
        "severity": issue.severity.value,
        "priority": issue.priority.value,
        "status": issue.status.value,
        "department_name": dept_name,
        "status_history": history_items,
        "assigned_officer_name": assigned_officer_name,
    }


@router.get("/", response_model=List[CivicIssueSummary])
def list_issues(
    category: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    ward: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = db.query(CivicIssue)
    if category:
        q = q.filter(CivicIssue.category == category)
    if status:
        q = q.filter(CivicIssue.status == status)
    if priority:
        q = q.filter(CivicIssue.priority == priority)
    if ward:
        q = q.filter(CivicIssue.ward == ward)
    issues = q.order_by(CivicIssue.priority_score.desc(), CivicIssue.first_reported_at.desc()).offset(offset).limit(limit).all()

    result = []
    for issue in issues:
        dept_name = None
        if issue.department_id:
            dept = db.query(Department).filter(Department.id == issue.department_id).first()
            dept_name = dept.name if dept else None
        result.append(CivicIssueSummary(
            id=issue.id,
            issue_number=issue.issue_number,
            category=issue.category,
            title=issue.title,
            latitude=issue.latitude,
            longitude=issue.longitude,
            address=issue.address,
            ward=issue.ward,
            severity=issue.severity.value,
            priority=issue.priority.value,
            priority_score=issue.priority_score,
            status=issue.status.value,
            report_count=issue.report_count,
            department_name=dept_name,
            first_reported_at=issue.first_reported_at,
            ai_confidence=issue.ai_confidence,
            ai_is_mock=issue.ai_is_mock,
        ))
    return result


@router.get("/nearby", response_model=List[CivicIssueSummary])
def nearby_issues(
    lat: float = Query(...),
    lon: float = Query(...),
    radius_meters: float = Query(1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return issues within radius_meters of (lat, lon)."""
    import math

    all_issues = db.query(CivicIssue).filter(
        CivicIssue.status.notin_([IssueStatus.closed])
    ).all()

    def haversine(lat1, lon1, lat2, lon2):
        R = 6_371_000
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi, dlambda = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
        a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    nearby = []
    for issue in all_issues:
        if issue.latitude and issue.longitude:
            d = haversine(lat, lon, issue.latitude, issue.longitude)
            if d <= radius_meters:
                dept_name = None
                if issue.department_id:
                    dept = db.query(Department).filter(Department.id == issue.department_id).first()
                    dept_name = dept.name if dept else None
                nearby.append(CivicIssueSummary(
                    id=issue.id,
                    issue_number=issue.issue_number,
                    category=issue.category,
                    title=issue.title,
                    latitude=issue.latitude,
                    longitude=issue.longitude,
                    address=issue.address,
                    ward=issue.ward,
                    severity=issue.severity.value,
                    priority=issue.priority.value,
                    priority_score=issue.priority_score,
                    status=issue.status.value,
                    report_count=issue.report_count,
                    department_name=dept_name,
                    first_reported_at=issue.first_reported_at,
                    ai_confidence=issue.ai_confidence,
                    ai_is_mock=issue.ai_is_mock,
                ))
    return nearby


@router.get("/{issue_id}", response_model=CivicIssueDetail)
def get_issue(
    issue_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    issue = db.query(CivicIssue).filter(CivicIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return CivicIssueDetail(**_enrich_issue(issue, db))


@router.post("/{issue_id}/assign")
def assign_issue(
    issue_id: str,
    req: AssignRequest,
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db),
):
    issue = db.query(CivicIssue).filter(CivicIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    officer = db.query(User).filter(User.id == req.officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")

    assignment = Assignment(
        civic_issue_id=issue.id,
        officer_id=req.officer_id,
        assigned_by=current_user.id,
        notes=req.notes,
    )
    db.add(assignment)

    old_status = issue.status.value
    issue.status = IssueStatus.assigned
    history = StatusHistory(
        civic_issue_id=issue.id,
        from_status=old_status,
        to_status=IssueStatus.assigned.value,
        changed_by=current_user.id,
        notes=f"Assigned to {officer.name}. {req.notes or ''}",
    )
    db.add(history)
    db.commit()

    return {"success": True, "message": f"Assigned to {officer.name}", "status": "assigned"}


@router.post("/{issue_id}/status")
def update_status(
    issue_id: str,
    req: StatusUpdateRequest,
    current_user: User = Depends(require_officer),
    db: Session = Depends(get_db),
):
    issue = db.query(CivicIssue).filter(CivicIssue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    try:
        new_status = IssueStatus(req.status)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid status: {req.status}")

    old_status = issue.status.value
    issue.status = new_status
    if new_status == IssueStatus.resolved:
        issue.resolved_at = datetime.utcnow()

    history = StatusHistory(
        civic_issue_id=issue.id,
        from_status=old_status,
        to_status=new_status.value,
        changed_by=current_user.id,
        notes=req.notes,
    )
    db.add(history)
    db.commit()

    return {"success": True, "new_status": new_status.value}
