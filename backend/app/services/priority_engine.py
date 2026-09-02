"""
Priority Engine — Transparent Rule-Based Scoring
=================================================
Calculates CRITICAL / HIGH / MEDIUM / LOW priority for a civic issue.

Weights are configurable in config.py.
This module is ML-ready: replace _calculate_score() with a trained model
(XGBoost/RandomForest) without changing the API.
"""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
from app.config import settings


SEVERITY_SCORES = {
    "low": 0.2,
    "medium": 0.5,
    "high": 0.8,
    "critical": 1.0,
}

HIGH_IMPORTANCE_KEYWORDS = [
    "school", "hospital", "market", "main road", "highway",
    "railway", "bus stand", "station", "junction",
]


@dataclass
class PriorityResult:
    priority: str  # CRITICAL / HIGH / MEDIUM / LOW
    score: float   # 0.0 - 1.0
    reasons: list[str] = field(default_factory=list)


def _report_count_score(report_count: int) -> float:
    """Normalize report count to 0-1. Saturates at 15+."""
    return min(report_count / 15.0, 1.0)


def _days_unresolved_score(first_reported_at: Optional[datetime]) -> float:
    """Normalize days unresolved to 0-1. Saturates at 14 days."""
    if not first_reported_at:
        return 0.0
    now = datetime.now(timezone.utc)
    if first_reported_at.tzinfo is None:
        first_reported_at = first_reported_at.replace(tzinfo=timezone.utc)
    days = (now - first_reported_at).days
    return min(days / 14.0, 1.0)


def _location_importance_score(address: Optional[str], ward: Optional[str]) -> tuple[float, list[str]]:
    """Score based on keywords in address/ward indicating important locations."""
    score = 0.3  # baseline
    reasons = []
    text = ((address or "") + " " + (ward or "")).lower()
    for kw in HIGH_IMPORTANCE_KEYWORDS:
        if kw in text:
            score = min(score + 0.3, 1.0)
            reasons.append(f"Near {kw}")
    return score, reasons


def _public_safety_score(category: str, severity: str) -> tuple[float, list[str]]:
    """High-risk categories in critical/high severity → public safety concern."""
    high_risk = {"pothole", "water_leakage", "damaged_road"}
    reasons = []
    score = 0.0
    if category in high_risk and severity in ("high", "critical"):
        score = 0.8
        reasons.append("Public safety risk")
    elif category in high_risk:
        score = 0.4
    return score, reasons


def _score_to_priority(score: float) -> str:
    if score >= 0.75:
        return "critical"
    elif score >= 0.55:
        return "high"
    elif score >= 0.35:
        return "medium"
    return "low"


def calculate_priority(
    severity: str,
    report_count: int,
    first_reported_at: Optional[datetime],
    address: Optional[str] = None,
    ward: Optional[str] = None,
    category: str = "",
) -> PriorityResult:
    """
    Calculate priority score and label for a civic issue.
    All weights come from settings (config.py).
    """
    reasons = []

    # Individual component scores
    sev_score = SEVERITY_SCORES.get(severity, 0.5)
    rep_score = _report_count_score(report_count)
    days_score = _days_unresolved_score(first_reported_at)
    loc_score, loc_reasons = _location_importance_score(address, ward)
    safety_score, safety_reasons = _public_safety_score(category, severity)

    # Weighted sum
    total = (
        sev_score * settings.severity_weight
        + rep_score * settings.report_count_weight
        + days_score * settings.days_unresolved_weight
        + loc_score * settings.location_importance_weight
        + safety_score * settings.public_safety_weight
    )

    # Collect human-readable reasons
    if sev_score >= 0.8:
        reasons.append(f"High severity issue")
    if report_count >= 5:
        reasons.append(f"{report_count} citizens have reported this")
    if days_score >= 0.5:
        days = int(days_score * 14)
        reasons.append(f"Unresolved for ~{max(days, 1)} days")
    reasons.extend(loc_reasons)
    reasons.extend(safety_reasons)
    if not reasons:
        reasons.append("Standard civic issue")

    priority = _score_to_priority(total)

    return PriorityResult(
        priority=priority,
        score=round(total, 3),
        reasons=reasons,
    )
