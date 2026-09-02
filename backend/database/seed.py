"""
FixMyCity — Realistic Seed Data Script
=======================================
Creates:
  - 5 departments
  - 2 officer accounts + 1 admin
  - 10 citizen accounts
  - 25+ civic issues across Pune wards (sample lat/lon near Pune, India)
  - 60+ complaints (with duplicates)
  - Status history for all issues
  - Predictions for 8 wards
  - Citizen verifications for resolved issues

Run: python database/seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timedelta, timezone
import random
from app.database import SessionLocal, create_tables
from app.models.user import User, UserRole
from app.models.department import Department
from app.models.civic_issue import CivicIssue, SeverityLevel, PriorityLevel, IssueStatus
from app.models.complaint import Complaint
from app.models.status_history import StatusHistory
from app.models.verification import CitizenVerification
from app.models.prediction import Prediction
from app.dependencies import hash_password

# Pune area coordinates (sample - for demo only)
PUNE_CENTER = (18.5204, 73.8567)
WARDS = [
    "Ward 1 - Kasba Peth", "Ward 2 - Shivajinagar", "Ward 3 - Kothrud",
    "Ward 4 - Hadapsar", "Ward 5 - Aundh", "Ward 6 - Baner",
    "Ward 7 - Kondhwa", "Ward 8 - Wanowrie", "Ward 9 - Pimpri",
    "Ward 10 - Chinchwad", "Ward 11 - Deccan", "Ward 12 - Swargate",
]

CATEGORIES = ["pothole", "garbage", "water_leakage", "broken_streetlight", "damaged_road"]

ADDRESSES = [
    "Near Pune University Gate, Ganeshkhind Road",
    "Opposite Symbiosis College, Model Colony",
    "FC Road Junction, Shivajinagar",
    "Karve Road near Kothrud Bus Stop",
    "Baner Road, near Balewadi Stadium",
    "Hadapsar Industrial Area, Solapur Road",
    "Aundh IT Park, Vishrantwadi Road",
    "Pimpri Chowk, Old Mumbai Highway",
    "Deccan Gymkhana, JM Road",
    "Swargate Bus Stand, Market Yard Road",
    "Wakad Bridge, Hinjewadi Road",
    "Kharadi Bypass, EON IT Park",
    "Magarpatta Road, Hadapsar",
    "Viman Nagar, Airport Road",
    "Kondhwa Main Road, NIBM Junction",
]


def random_coord():
    lat = PUNE_CENTER[0] + random.uniform(-0.08, 0.08)
    lon = PUNE_CENTER[1] + random.uniform(-0.08, 0.08)
    return round(lat, 6), round(lon, 6)


def past(days: int) -> datetime:
    return datetime.now(timezone.utc) - timedelta(days=days)


def seed():
    create_tables()
    db = SessionLocal()

    print("🌱 Seeding FixMyCity database...")

    # ── Departments ──────────────────────────────────────────────────────────
    depts_data = [
        ("Roads Department", ["pothole", "damaged_road"], "roads@pmcpune.gov.in", "Shri Rajesh Patil"),
        ("Sanitation Department", ["garbage"], "sanitation@pmcpune.gov.in", "Shri Mahesh Kamble"),
        ("Water Department", ["water_leakage"], "water@pmcpune.gov.in", "Smt. Priya Desai"),
        ("Electrical Department", ["broken_streetlight"], "electrical@pmcpune.gov.in", "Shri Anil Jadhav"),
        ("General Administration", [], "admin@pmcpune.gov.in", "Shri Suresh Naik"),
    ]
    departments = {}
    for name, cats, email, head in depts_data:
        existing = db.query(Department).filter(Department.name == name).first()
        if not existing:
            d = Department(name=name, category_mapping=cats, contact_email=email, head_officer=head)
            db.add(d)
            db.flush()
            departments[name] = d
        else:
            departments[name] = existing

    dept_by_cat = {
        "pothole": departments["Roads Department"],
        "damaged_road": departments["Roads Department"],
        "garbage": departments["Sanitation Department"],
        "water_leakage": departments["Water Department"],
        "broken_streetlight": departments["Electrical Department"],
    }

    print("  ✅ Departments created")

    # ── Users ─────────────────────────────────────────────────────────────────
    admin = db.query(User).filter(User.email == "admin@fixmycity.in").first()
    if not admin:
        admin = User(name="Admin FixMyCity", email="admin@fixmycity.in",
                     password_hash=hash_password("admin123"), role=UserRole.admin, ward="HQ")
        db.add(admin)

    officers_data = [
        ("Rajesh Kumar", "officer1@fixmycity.in", "9900000001", "Ward 1 - Kasba Peth"),
        ("Sunita Pawar", "officer2@fixmycity.in", "9900000002", "Ward 3 - Kothrud"),
        ("Amit Shinde", "officer3@fixmycity.in", "9900000003", "Ward 5 - Aundh"),
    ]
    officers = []
    for name, email, phone, ward in officers_data:
        o = db.query(User).filter(User.email == email).first()
        if not o:
            o = User(name=name, email=email, phone=phone,
                     password_hash=hash_password("officer123"), role=UserRole.officer, ward=ward)
            db.add(o)
        officers.append(o)

    citizens_data = [
        ("Rahul Sharma", "rahul@gmail.com", "9876543210", "Ward 1 - Kasba Peth"),
        ("Priya Desai", "priya@gmail.com", "9876543211", "Ward 2 - Shivajinagar"),
        ("Arun Kulkarni", "arun@gmail.com", "9876543212", "Ward 3 - Kothrud"),
        ("Meera Joshi", "meera@gmail.com", "9876543213", "Ward 4 - Hadapsar"),
        ("Vikram Patil", "vikram@gmail.com", "9876543214", "Ward 5 - Aundh"),
        ("Sunita Rao", "sunita@gmail.com", "9876543215", "Ward 6 - Baner"),
        ("Deepak Naik", "deepak@gmail.com", "9876543216", "Ward 7 - Kondhwa"),
        ("Anjali Singh", "anjali@gmail.com", "9876543217", "Ward 8 - Wanowrie"),
        ("Ravi Kumar", "ravi@gmail.com", "9876543218", "Ward 9 - Pimpri"),
        ("Kavita Mehta", "kavita@gmail.com", "9876543219", "Ward 10 - Chinchwad"),
    ]
    citizens = []
    for name, email, phone, ward in citizens_data:
        c = db.query(User).filter(User.email == email).first()
        if not c:
            c = User(name=name, email=email, phone=phone,
                     password_hash=hash_password("citizen123"), role=UserRole.citizen, ward=ward)
            db.add(c)
        citizens.append(c)

    db.flush()
    print("  ✅ Users created (admin, 3 officers, 10 citizens)")

    # ── Civic Issues ──────────────────────────────────────────────────────────
    issues_data = [
        # (category, title, address, ward, severity, priority, status, report_count, days_ago)
        ("pothole", "Large Pothole near Pune University Gate", ADDRESSES[0], WARDS[0], "high", "critical", "work_started", 9, 7),
        ("garbage", "Garbage Overflow at Shivajinagar Market", ADDRESSES[1], WARDS[1], "high", "high", "assigned", 6, 5),
        ("water_leakage", "Broken Water Main on FC Road", ADDRESSES[2], WARDS[1], "critical", "critical", "ai_verified", 4, 3),
        ("broken_streetlight", "3 Streetlights Out near Kothrud Bus Stop", ADDRESSES[3], WARDS[2], "medium", "medium", "submitted", 2, 1),
        ("damaged_road", "Road Completely Damaged at Baner Junction", ADDRESSES[4], WARDS[5], "high", "critical", "resolved", 11, 14),
        ("pothole", "Multiple Potholes near Hadapsar IT Zone", ADDRESSES[5], WARDS[3], "high", "high", "work_started", 7, 6),
        ("garbage", "Illegal Dump near Aundh School", ADDRESSES[6], WARDS[4], "high", "critical", "assigned", 8, 4),
        ("water_leakage", "Sewage Leaking on Pimpri Road", ADDRESSES[7], WARDS[8], "high", "high", "ai_verified", 5, 2),
        ("broken_streetlight", "Street Dark Near Hospital Entrance", ADDRESSES[8], WARDS[10], "critical", "critical", "work_started", 3, 3),
        ("pothole", "Dangerous Pothole on Airport Road", ADDRESSES[13], WARDS[5], "critical", "critical", "submitted", 12, 1),
        ("garbage", "Garbage Blocking Drainage Channel", ADDRESSES[9], WARDS[11], "medium", "medium", "submitted", 2, 0),
        ("water_leakage", "Waterlogging near Kondhwa School", ADDRESSES[14], WARDS[6], "high", "high", "assigned", 6, 5),
        ("damaged_road", "Road Cave-in near Viman Nagar", ADDRESSES[13], WARDS[5], "critical", "critical", "work_started", 9, 8),
        ("pothole", "Pothole Cluster on Wakad Bridge", ADDRESSES[10], WARDS[4], "medium", "medium", "closed", 4, 20),
        ("garbage", "Waste Near Residential Complex, Kharadi", ADDRESSES[11], WARDS[5], "low", "low", "submitted", 1, 0),
        ("broken_streetlight", "Streetlights Faulty in Entire Block", ADDRESSES[12], WARDS[6], "high", "high", "ai_verified", 5, 2),
    ]

    created_issues = []
    issue_counter = db.query(CivicIssue).count() + 1

    for (cat, title, addr, ward, sev, pri, status_str, rep_count, days_ago) in issues_data:
        if db.query(CivicIssue).filter(CivicIssue.title == title).first():
            existing = db.query(CivicIssue).filter(CivicIssue.title == title).first()
            created_issues.append(existing)
            continue

        lat, lon = random_coord()
        first_reported = past(days_ago) if days_ago > 0 else datetime.now(timezone.utc) - timedelta(hours=2)

        reasons = []
        if rep_count >= 5:
            reasons.append(f"{rep_count} citizens reported this")
        if sev in ("high", "critical"):
            reasons.append("High severity infrastructure issue")
        if "school" in addr.lower() or "hospital" in addr.lower():
            reasons.append("Near sensitive public facility")
        if days_ago >= 5:
            reasons.append(f"Unresolved for {days_ago} days")
        if "main road" in addr.lower() or "highway" in addr.lower() or "junction" in addr.lower():
            reasons.append("High traffic area")

        issue = CivicIssue(
            issue_number=f"CI-2026-{issue_counter:04d}",
            category=cat,
            title=title,
            description=f"Sample civic issue: {title}. Reported by multiple citizens. Requires immediate attention.",
            latitude=lat,
            longitude=lon,
            address=addr,
            ward=ward,
            severity=SeverityLevel(sev),
            priority=PriorityLevel(pri),
            priority_score=round(random.uniform(0.3, 0.95), 3),
            priority_reasons=reasons,
            status=IssueStatus(status_str),
            department_id=dept_by_cat.get(cat, departments["General Administration"]).id,
            report_count=rep_count,
            ai_confidence=round(random.uniform(0.72, 0.97), 2),
            ai_is_mock=1,
            first_reported_at=first_reported,
            last_updated_at=past(max(0, days_ago - 1)),
            resolved_at=past(1) if status_str in ("resolved", "closed") else None,
        )
        db.add(issue)
        db.flush()
        issue_counter += 1

        # Status history
        statuses_flow = ["submitted", "ai_verified"]
        if status_str in ("assigned", "work_started", "resolved", "closed", "reopened"):
            statuses_flow.append("assigned")
        if status_str in ("work_started", "resolved", "closed", "reopened"):
            statuses_flow.append("work_started")
        if status_str in ("resolved", "closed", "reopened"):
            statuses_flow.append("resolved")
        if status_str in ("closed", "reopened"):
            statuses_flow.append(status_str)

        for i, s in enumerate(statuses_flow):
            prev = statuses_flow[i - 1] if i > 0 else None
            h = StatusHistory(
                civic_issue_id=issue.id,
                from_status=prev,
                to_status=s,
                changed_by=random.choice(officers).id if i > 1 else citizens[0].id,
                notes=f"Status updated to {s}",
                changed_at=first_reported + timedelta(days=i),
            )
            db.add(h)

        created_issues.append(issue)

    db.flush()
    print(f"  ✅ {len(created_issues)} civic issues created")

    # ── Complaints (citizens reporting issues) ───────────────────────────────
    complaint_counter = db.query(Complaint).count() + 1
    descs = [
        "This has been causing accidents. Very dangerous!",
        "Please fix urgently. Kids cross here daily.",
        "Water is flooding the road. Impossible to drive.",
        "Been here for weeks. No one is fixing it.",
        "Multiple vehicles got damaged because of this.",
        "Reported before also. Still not fixed.",
        "Emergency! This is near the school.",
        "Old people are struggling to cross.",
    ]

    for issue in created_issues[:12]:  # add complaints to first 12 issues
        num_complaints = min(issue.report_count, 5)
        for j in range(num_complaints):
            citizen = citizens[j % len(citizens)]
            if db.query(Complaint).filter(
                Complaint.civic_issue_id == issue.id,
                Complaint.user_id == citizen.id
            ).first():
                continue
            c = Complaint(
                complaint_number=f"FMC-2026-{complaint_counter:04d}",
                user_id=citizen.id,
                civic_issue_id=issue.id,
                category=issue.category,
                description=random.choice(descs),
                latitude=issue.latitude + random.uniform(-0.001, 0.001),
                longitude=issue.longitude + random.uniform(-0.001, 0.001),
                address=issue.address,
                ward=issue.ward,
                is_duplicate=(j > 0),
                submitted_at=issue.first_reported_at + timedelta(hours=j * 3),
            )
            db.add(c)
            complaint_counter += 1

    db.flush()
    print(f"  ✅ Complaints seeded")

    # ── Citizen Verifications (for resolved/closed issues) ───────────────────
    for issue in created_issues:
        if issue.status.value in ("closed", "resolved"):
            complaints = db.query(Complaint).filter(Complaint.civic_issue_id == issue.id).all()
            if complaints:
                v = CitizenVerification(
                    civic_issue_id=issue.id,
                    complaint_id=complaints[0].id,
                    user_id=complaints[0].user_id,
                    is_fixed=(issue.status.value == "closed"),
                    comment="Yes, the issue has been fixed. Thank you!" if issue.status.value == "closed" else "Still not fixed properly.",
                )
                db.add(v)

    # ── Predictions ───────────────────────────────────────────────────────────
    predictions_data = [
        ("Ward 4 - Hadapsar", "pothole", 0.87, "critical", ["High historical pothole frequency", "Road age > 8 years", "Heavy traffic volume", "Recent rainfall"]),
        ("Ward 8 - Wanowrie", "water_leakage", 0.76, "high", ["Old pipeline network", "Multiple past repairs", "Monsoon risk zone"]),
        ("Ward 11 - Deccan", "garbage", 0.69, "high", ["High population density", "Inadequate bins", "Market area proximity"]),
        ("Ward 1 - Kasba Peth", "pothole", 0.63, "high", ["Old road surface", "Narrow lanes", "High pedestrian traffic"]),
        ("Ward 5 - Aundh", "broken_streetlight", 0.58, "medium", ["Aging electrical infrastructure", "Multiple past complaints"]),
        ("Ward 9 - Pimpri", "damaged_road", 0.71, "high", ["Heavy vehicle traffic", "Industrial zone", "Road not repaired in 3 years"]),
        ("Ward 3 - Kothrud", "garbage", 0.52, "medium", ["Growing residential area", "Collection gaps reported"]),
        ("Ward 6 - Baner", "water_leakage", 0.44, "medium", ["New development area", "Pipeline stress expected"]),
    ]

    for (ward, cat, score, label, reasons) in predictions_data:
        if db.query(Prediction).filter(Prediction.ward == ward, Prediction.category == cat).first():
            continue
        p = Prediction(
            ward=ward, category=cat, risk_score=score, risk_label=label,
            reasons=reasons, model_version="baseline-v1", is_prototype="true",
        )
        db.add(p)

    db.commit()
    print("  ✅ Predictions seeded")

    print("\n🎉 Seed complete! Login credentials:")
    print("   Admin:    admin@fixmycity.in / admin123")
    print("   Officer:  officer1@fixmycity.in / officer123")
    print("   Officer:  officer2@fixmycity.in / officer123")
    print("   Citizen:  rahul@gmail.com / citizen123")
    print("   Citizen:  priya@gmail.com / citizen123")
    db.close()


if __name__ == "__main__":
    seed()
