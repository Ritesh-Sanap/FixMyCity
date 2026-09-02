"""
Women Safety Emergency SOS API
New router — does not modify any existing endpoint.

Endpoints:
  POST /api/sos/trigger            — Activate SOS
  POST /api/sos/cancel             — Cancel accidental SOS
  POST /api/sos/safe               — Mark I'm Safe
  GET  /api/sos/active-alert       — Get my active alert
  GET  /api/sos/contacts           — List my emergency contacts
  POST /api/sos/contacts           — Add contact
  DELETE /api/sos/contacts/{id}    — Delete contact
  GET  /api/sos/safety-zones       — Safety Intelligence from civic complaints
  GET  /api/sos/active-alerts      — Officer: all active SOS alerts
  GET  /api/sos/safety-stats       — Overall safety stats for dashboard
"""
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.dependencies import get_current_user, require_officer
from app.models.user import User
from app.models.sos import SOSAlert, SOSStatus, EmergencyContact
from app.models.civic_issue import CivicIssue, IssueStatus

router = APIRouter(prefix="/api/sos", tags=["sos"])

# ── Pydantic schemas ──────────────────────────────────────────────────────────

class TriggerSOSRequest(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    ward: Optional[str] = None
    note: Optional[str] = None

class ContactRequest(BaseModel):
    name: str
    phone: str
    relation: Optional[str] = "Emergency Contact"

class ContactResponse(BaseModel):
    id: str
    name: str
    phone: str
    relation: Optional[str]
    class Config: from_attributes = True

class SOSAlertResponse(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    latitude: Optional[float]
    longitude: Optional[float]
    address: Optional[str]
    ward: Optional[str]
    status: str
    note: Optional[str]
    created_at: datetime
    resolved_at: Optional[datetime]
    class Config: from_attributes = True

class SafetyZone(BaseModel):
    ward: str
    latitude: float
    longitude: float
    risk_score: float
    risk_label: str
    reasons: List[str]
    complaint_count: int
    unresolved_count: int

# ── Ward centre coordinates for Pune (demo data for map rendering) ────────────
WARD_CENTRES = {
    "Ward 1 - Shivajinagar": (18.5308, 73.8474),
    "Ward 2 - Deccan":       (18.5195, 73.8553),
    "Ward 3 - Kothrud":      (18.5074, 73.8077),
    "Ward 4 - Hadapsar":     (18.4985, 73.9259),
    "Ward 5 - Kondhwa":      (18.4603, 73.8878),
    "Ward 6 - Baner":        (18.5590, 73.7868),
    "Ward 7 - Wakad":        (18.5975, 73.7898),
    "Ward 8 - Kharadi":      (18.5512, 73.9442),
    "Ward 9 - Viman Nagar":  (18.5679, 73.9143),
    "Ward 10 - Aundh":       (18.5590, 73.8075),
    "Ward 11 - Pimpri":      (18.6297, 73.7997),
    "Ward 12 - Chinchwad":   (18.6181, 73.8001),
    "Pune Central":          (18.5204, 73.8567),
}

# Unsafe issue categories and their safety weights
SAFETY_WEIGHTS = {
    "broken_streetlight": 3.0,   # Major safety risk — dark roads
    "damaged_road":       1.5,   # Accident risk
    "garbage":            0.8,   # Sanitation / neglect signal
    "water_leakage":      0.5,
    "pothole":            1.0,
}

# ── Helper: compute safety zone for a ward ───────────────────────────────────
def _compute_zone(ward: str, issues: list) -> Optional[SafetyZone]:
    coords = None
    for k, v in WARD_CENTRES.items():
        if k.lower() in ward.lower() or ward.lower() in k.lower():
            coords = v
            break
    if not coords:
        # Try to pick from issue coordinates
        for i in issues:
            if i.latitude and i.longitude:
                coords = (i.latitude, i.longitude)
                break
    if not coords:
        return None

    total_weight = 0.0
    unresolved_count = 0
    reasons = []

    # Count by category
    cat_counts: dict = {}
    for issue in issues:
        cat = issue.category
        cat_counts[cat] = cat_counts.get(cat, 0) + 1
        is_active = issue.status not in (IssueStatus.resolved, IssueStatus.closed)
        if is_active:
            unresolved_count += 1
            w = SAFETY_WEIGHTS.get(cat, 0.5)
            if issue.priority in ("critical", "high"):
                w *= 1.5
            total_weight += w

    # Build human-readable reasons
    if cat_counts.get("broken_streetlight", 0) > 0:
        reasons.append(f"{cat_counts['broken_streetlight']} broken streetlight complaint(s) — poor lighting")
    if cat_counts.get("damaged_road", 0) > 0:
        reasons.append(f"{cat_counts['damaged_road']} damaged road complaint(s) — accident risk")
    if unresolved_count > 3:
        reasons.append(f"{unresolved_count} unresolved civic complaints — neglected area")
    if len(issues) > 5:
        reasons.append(f"{len(issues)} total complaints — high-incident zone")

    # Normalize risk score (0–1)
    # Scale: weight > 15 → critical, 8-15 → high, 3-8 → medium, <3 → low
    raw = total_weight
    if raw >= 15:
        risk_score = 0.90
        risk_label = "critical"
    elif raw >= 8:
        risk_score = 0.72
        risk_label = "high"
    elif raw >= 3:
        risk_score = 0.48
        risk_label = "medium"
    else:
        risk_score = 0.20
        risk_label = "low"

    if not reasons:
        reasons = ["Minimal civic complaints — relatively safe area"]

    return SafetyZone(
        ward=ward,
        latitude=coords[0],
        longitude=coords[1],
        risk_score=risk_score,
        risk_label=risk_label,
        reasons=reasons,
        complaint_count=len(issues),
        unresolved_count=unresolved_count,
    )


# ── SOS Endpoints ─────────────────────────────────────────────────────────────

@router.post("/trigger", response_model=SOSAlertResponse)
def trigger_sos(
    req: TriggerSOSRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Cancel any existing active SOS first
    existing = db.query(SOSAlert).filter(
        SOSAlert.user_id == current_user.id,
        SOSAlert.status == SOSStatus.active,
    ).first()
    if existing:
        existing.status = SOSStatus.cancelled
        existing.resolved_at = datetime.utcnow()

    alert = SOSAlert(
        user_id=current_user.id,
        latitude=req.latitude,
        longitude=req.longitude,
        address=req.address or "Location captured",
        ward=req.ward,
        note=req.note,
        status=SOSStatus.active,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    result = SOSAlertResponse(
        id=alert.id,
        user_id=alert.user_id,
        user_name=current_user.name,
        latitude=alert.latitude,
        longitude=alert.longitude,
        address=alert.address,
        ward=alert.ward,
        status=alert.status.value,
        note=alert.note,
        created_at=alert.created_at,
        resolved_at=alert.resolved_at,
    )
    return result


@router.post("/cancel")
def cancel_sos(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(SOSAlert).filter(
        SOSAlert.user_id == current_user.id,
        SOSAlert.status == SOSStatus.active,
    ).first()
    if alert:
        alert.status = SOSStatus.cancelled
        alert.resolved_at = datetime.utcnow()
        db.commit()
    return {"message": "SOS cancelled", "status": "cancelled"}


@router.post("/safe")
def mark_safe(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(SOSAlert).filter(
        SOSAlert.user_id == current_user.id,
        SOSAlert.status == SOSStatus.active,
    ).first()
    if alert:
        alert.status = SOSStatus.safe
        alert.resolved_at = datetime.utcnow()
        db.commit()
    return {"message": "Marked as safe", "status": "safe"}


@router.get("/active-alert", response_model=Optional[SOSAlertResponse])
def get_active_alert(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    alert = db.query(SOSAlert).filter(
        SOSAlert.user_id == current_user.id,
        SOSAlert.status == SOSStatus.active,
    ).first()
    if not alert:
        return None
    return SOSAlertResponse(
        id=alert.id,
        user_id=alert.user_id,
        user_name=current_user.name,
        latitude=alert.latitude,
        longitude=alert.longitude,
        address=alert.address,
        ward=alert.ward,
        status=alert.status.value,
        note=alert.note,
        created_at=alert.created_at,
        resolved_at=alert.resolved_at,
    )


# ── Emergency Contacts ────────────────────────────────────────────────────────

@router.get("/contacts", response_model=List[ContactResponse])
def get_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contacts = db.query(EmergencyContact).filter(
        EmergencyContact.user_id == current_user.id
    ).all()
    return contacts


@router.post("/contacts", response_model=ContactResponse)
def add_contact(
    req: ContactRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = db.query(EmergencyContact).filter(
        EmergencyContact.user_id == current_user.id
    ).count()
    if count >= 5:
        raise HTTPException(status_code=400, detail="Maximum 5 emergency contacts allowed")
    contact = EmergencyContact(
        user_id=current_user.id,
        name=req.name,
        phone=req.phone,
        relation=req.relation,
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/contacts/{contact_id}")
def delete_contact(
    contact_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    contact = db.query(EmergencyContact).filter(
        EmergencyContact.id == contact_id,
        EmergencyContact.user_id == current_user.id,
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return {"message": "Contact deleted"}


# ── Safety Intelligence ───────────────────────────────────────────────────────

@router.get("/safety-zones", response_model=List[SafetyZone])
def get_safety_zones(db: Session = Depends(get_db)):
    """
    Compute safety risk zones from existing FixMyCity civic complaint data.
    Groups complaints by ward, weights by safety-relevant categories,
    and returns risk scores with human-readable reasons.
    
    This is the core differentiator: Civic Data → Safety Intelligence.
    """
    issues = db.query(CivicIssue).all()

    # Group by ward
    ward_issues: dict = {}
    for issue in issues:
        ward = issue.ward or "Pune Central"
        ward_issues.setdefault(ward, []).append(issue)

    zones = []
    for ward, ward_issue_list in ward_issues.items():
        zone = _compute_zone(ward, ward_issue_list)
        if zone:
            zones.append(zone)

    # Sort by risk score descending
    zones.sort(key=lambda z: z.risk_score, reverse=True)
    return zones


# ── Officer: Active SOS Alerts ────────────────────────────────────────────────

@router.get("/active-alerts", response_model=List[SOSAlertResponse])
def get_all_active_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_officer),
):
    alerts = db.query(SOSAlert).filter(
        SOSAlert.status == SOSStatus.active
    ).order_by(SOSAlert.created_at.desc()).all()

    result = []
    for alert in alerts:
        user = db.query(User).filter(User.id == alert.user_id).first()
        result.append(SOSAlertResponse(
            id=alert.id,
            user_id=alert.user_id,
            user_name=user.name if user else "Unknown",
            latitude=alert.latitude,
            longitude=alert.longitude,
            address=alert.address,
            ward=alert.ward,
            status=alert.status.value,
            note=alert.note,
            created_at=alert.created_at,
            resolved_at=alert.resolved_at,
        ))
    return result


@router.get("/safety-stats")
def get_safety_stats(db: Session = Depends(get_db)):
    total_sos = db.query(SOSAlert).count()
    active_sos = db.query(SOSAlert).filter(SOSAlert.status == SOSStatus.active).count()
    resolved_safe = db.query(SOSAlert).filter(SOSAlert.status == SOSStatus.safe).count()
    streetlight_complaints = db.query(CivicIssue).filter(
        CivicIssue.category == "broken_streetlight",
        CivicIssue.status.notin_(["resolved", "closed"]),
    ).count()
    return {
        "total_sos_triggered": total_sos,
        "active_sos": active_sos,
        "resolved_safe": resolved_safe,
        "unresolved_streetlight_complaints": streetlight_complaints,
        "safety_disclaimer": "PROTOTYPE — Demo data only. Not connected to real emergency services.",
    }
