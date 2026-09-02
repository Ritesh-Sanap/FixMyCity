import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.complaint import Complaint
from app.models.civic_issue import CivicIssue, IssueStatus, SeverityLevel, PriorityLevel
from app.models.status_history import StatusHistory
from app.models.department import Department
from app.schemas.complaint import (
    ComplaintResponse, SubmitComplaintResponse, CivicIssueSummary,
    CivicIssueDetail, StatusHistoryItem, VerificationRequest
)
from app.models.verification import CitizenVerification
from app.dependencies import get_current_user, require_citizen, require_officer
from app.services.ai_classifier import classifier
from app.services.duplicate_detector import detect_duplicate
from app.services.priority_engine import calculate_priority
from app.services.department_router import route_to_department
from app.config import settings

router = APIRouter(prefix="/api/complaints", tags=["Complaints"])


def _next_complaint_number(db: Session) -> str:
    count = db.query(Complaint).count() + 1
    return f"FMC-{datetime.utcnow().year}-{count:04d}"


def _next_issue_number(db: Session) -> str:
    count = db.query(CivicIssue).count() + 1
    return f"CI-{datetime.utcnow().year}-{count:04d}"


def _save_image(upload: UploadFile) -> tuple[str, str]:
    """Save uploaded image, return (relative_path, url_path)."""
    os.makedirs(settings.upload_dir, exist_ok=True)
    ext = os.path.splitext(upload.filename or "image.jpg")[1] or ".jpg"
    filename = f"{uuid.uuid4()}{ext}"
    path = os.path.join(settings.upload_dir, filename)
    with open(path, "wb") as f:
        f.write(upload.file.read())
    return path, f"/uploads/{filename}"


@router.post("/", response_model=SubmitComplaintResponse)
async def submit_complaint(
    category: str = Form(...),
    description: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    address: Optional[str] = Form(None),
    ward: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_citizen),
    db: Session = Depends(get_db),
):
    # 1. Save image if provided
    image_path, image_url = None, None
    if image and image.filename:
        image_path, image_url = _save_image(image)

    # 2. AI Classification
    ai_result = classifier.classify(
        image_path=image_path,
        description=description,
        filename=image.filename if image else None,
    )
    # Override category with AI if category is 'auto'
    effective_category = category if category != "auto" else ai_result.category

    # 3. Duplicate detection
    active_issues = db.query(CivicIssue).filter(
        CivicIssue.category == effective_category,
        CivicIssue.status.notin_([IssueStatus.closed]),
    ).all()

    dup_result = detect_duplicate(
        category=effective_category,
        latitude=latitude,
        longitude=longitude,
        description=description,
        existing_issues=active_issues,
    )

    # 4. Create the individual Complaint record
    complaint = Complaint(
        complaint_number=_next_complaint_number(db),
        user_id=current_user.id,
        category=effective_category,
        description=description,
        image_path=image_path,
        image_url=image_url,
        latitude=latitude,
        longitude=longitude,
        address=address,
        ward=ward or current_user.ward,
        is_duplicate=dup_result.is_duplicate,
    )

    # 5. Link to or create CivicIssue
    if dup_result.is_duplicate and dup_result.matched_issue_id:
        # Link to existing issue
        civic_issue = db.query(CivicIssue).filter(CivicIssue.id == dup_result.matched_issue_id).first()
        civic_issue.report_count += 1
        civic_issue.last_updated_at = datetime.utcnow()
        complaint.civic_issue_id = civic_issue.id
        db.add(complaint)

        # Recalculate priority with new count
        priority_result = calculate_priority(
            severity=civic_issue.severity.value,
            report_count=civic_issue.report_count,
            first_reported_at=civic_issue.first_reported_at,
            address=civic_issue.address,
            ward=civic_issue.ward,
            category=effective_category,
        )
        civic_issue.priority = PriorityLevel(priority_result.priority)
        civic_issue.priority_score = priority_result.score
        civic_issue.priority_reasons = priority_result.reasons
        db.commit()
        db.refresh(complaint)
        db.refresh(civic_issue)

    else:
        # Create new CivicIssue
        all_depts = db.query(Department).all()
        dept = route_to_department(effective_category, all_depts)

        priority_result = calculate_priority(
            severity=ai_result.severity,
            report_count=1,
            first_reported_at=None,
            address=address,
            ward=ward,
            category=effective_category,
        )

        civic_issue = CivicIssue(
            issue_number=_next_issue_number(db),
            category=effective_category,
            title=f"{effective_category.replace('_', ' ').title()} — {address or 'Unknown Location'}",
            description=description,
            image_path=image_path,
            image_url=image_url,
            latitude=latitude,
            longitude=longitude,
            address=address,
            ward=ward or current_user.ward,
            severity=SeverityLevel(ai_result.severity),
            priority=PriorityLevel(priority_result.priority),
            priority_score=priority_result.score,
            priority_reasons=priority_result.reasons,
            status=IssueStatus.ai_verified,
            department_id=dept.id if dept else None,
            report_count=1,
            ai_confidence=ai_result.confidence,
            ai_is_mock=1,
        )
        db.add(civic_issue)
        db.flush()  # get civic_issue.id

        complaint.civic_issue_id = civic_issue.id
        db.add(complaint)

        # Initial status history
        history = StatusHistory(
            civic_issue_id=civic_issue.id,
            from_status=None,
            to_status=IssueStatus.ai_verified.value,
            changed_by=current_user.id,
            notes="Complaint submitted and AI-verified",
        )
        db.add(history)
        db.commit()
        db.refresh(complaint)
        db.refresh(civic_issue)

    dept_name = None
    if civic_issue.department_id:
        dept_obj = db.query(Department).filter(Department.id == civic_issue.department_id).first()
        dept_name = dept_obj.name if dept_obj else None

    return SubmitComplaintResponse(
        complaint=ComplaintResponse.model_validate(complaint),
        civic_issue_id=civic_issue.id,
        civic_issue_number=civic_issue.issue_number,
        is_duplicate=dup_result.is_duplicate,
        duplicate_info={
            "matched_issue_number": dup_result.matched_issue_number,
            "distance_meters": dup_result.distance_meters,
            "existing_report_count": dup_result.existing_report_count,
        } if dup_result.is_duplicate else None,
        ai_classification={
            "category": ai_result.category,
            "confidence": ai_result.confidence,
            "severity": ai_result.severity,
            "is_mock": ai_result.is_mock,
            "disclaimer": ai_result.disclaimer,
        },
        priority=civic_issue.priority.value,
        priority_score=civic_issue.priority_score,
        priority_reasons=civic_issue.priority_reasons or [],
        department=dept_name,
        message=(
            f"Linked to existing issue {civic_issue.issue_number} with {civic_issue.report_count} reports."
            if dup_result.is_duplicate
            else f"New civic issue {civic_issue.issue_number} created."
        ),
    )


@router.get("/my", response_model=List[ComplaintResponse])
def my_complaints(
    current_user: User = Depends(require_citizen),
    db: Session = Depends(get_db),
):
    complaints = (
        db.query(Complaint)
        .filter(Complaint.user_id == current_user.id)
        .order_by(Complaint.submitted_at.desc())
        .all()
    )
    return complaints


@router.get("/{complaint_id}", response_model=ComplaintResponse)
def get_complaint(
    complaint_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    # Citizens can only see their own
    from app.models.user import UserRole
    if current_user.role == UserRole.citizen and complaint.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return complaint


@router.post("/{complaint_id}/verify")
def verify_complaint(
    complaint_id: str,
    req: VerificationRequest,
    current_user: User = Depends(require_citizen),
    db: Session = Depends(get_db),
):
    complaint = db.query(Complaint).filter(
        Complaint.id == complaint_id,
        Complaint.user_id == current_user.id,
    ).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    civic_issue = complaint.civic_issue
    if not civic_issue or civic_issue.status != IssueStatus.resolved:
        raise HTTPException(status_code=400, detail="Issue not in resolved state")

    # Create verification record
    verification = CitizenVerification(
        civic_issue_id=civic_issue.id,
        complaint_id=complaint.id,
        user_id=current_user.id,
        is_fixed=req.is_fixed,
        comment=req.comment,
    )
    db.add(verification)

    # Update issue status
    new_status = IssueStatus.closed if req.is_fixed else IssueStatus.reopened
    old_status = civic_issue.status.value
    civic_issue.status = new_status

    history = StatusHistory(
        civic_issue_id=civic_issue.id,
        from_status=old_status,
        to_status=new_status.value,
        changed_by=current_user.id,
        notes=f"Citizen verified: {'Fixed ✓' if req.is_fixed else 'Not fixed — Reopened'}",
    )
    db.add(history)
    db.commit()

    return {
        "success": True,
        "is_fixed": req.is_fixed,
        "new_status": new_status.value,
        "message": "Issue closed. Thank you!" if req.is_fixed else "Issue reopened. We apologize for the inconvenience.",
    }
