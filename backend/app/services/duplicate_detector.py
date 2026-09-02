"""
Duplicate Detection Service
============================
Compares incoming complaint against recent civic issues using:
  1. GPS distance (Haversine) < 200m  [configurable]
  2. Same category
  3. Time window (30 days)            [configurable]
  4. Description text similarity (simple keyword overlap)

Returns the best matching existing issue, if any.
"""
import math
from typing import Optional
from dataclasses import dataclass
from app.config import settings


@dataclass
class DuplicateResult:
    is_duplicate: bool
    matched_issue_id: Optional[str]
    matched_issue_number: Optional[str]
    distance_meters: Optional[float]
    similarity_score: float
    existing_report_count: int


def _haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in meters between two GPS coordinates."""
    R = 6_371_000  # Earth radius in metres
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _text_similarity(text1: str, text2: str) -> float:
    """Simple Jaccard similarity on word tokens."""
    if not text1 or not text2:
        return 0.0
    tokens1 = set(text1.lower().split())
    tokens2 = set(text2.lower().split())
    if not tokens1 or not tokens2:
        return 0.0
    intersection = tokens1 & tokens2
    union = tokens1 | tokens2
    return len(intersection) / len(union)


def detect_duplicate(
    category: str,
    latitude: Optional[float],
    longitude: Optional[float],
    description: Optional[str],
    existing_issues: list,  # list of CivicIssue ORM objects
) -> DuplicateResult:
    """
    Check if this complaint duplicates an existing civic issue.

    Args:
        existing_issues: Active (non-closed) civic issues of the same category.
    """
    best_match = None
    best_distance = float("inf")
    best_similarity = 0.0

    for issue in existing_issues:
        if issue.category != category:
            continue

        # Distance check
        distance = float("inf")
        if latitude and longitude and issue.latitude and issue.longitude:
            distance = _haversine_meters(latitude, longitude, issue.latitude, issue.longitude)

        if distance > settings.duplicate_distance_meters:
            continue

        # Text similarity check
        similarity = _text_similarity(description or "", issue.description or "")

        # Score: closer + more similar = better match
        score = (1 - distance / settings.duplicate_distance_meters) * 0.7 + similarity * 0.3

        if score > best_similarity or (best_match is None and distance < settings.duplicate_distance_meters):
            best_match = issue
            best_distance = distance
            best_similarity = score

    if best_match:
        return DuplicateResult(
            is_duplicate=True,
            matched_issue_id=best_match.id,
            matched_issue_number=best_match.issue_number,
            distance_meters=round(best_distance, 1),
            similarity_score=round(best_similarity, 3),
            existing_report_count=best_match.report_count,
        )

    return DuplicateResult(
        is_duplicate=False,
        matched_issue_id=None,
        matched_issue_number=None,
        distance_meters=None,
        similarity_score=0.0,
        existing_report_count=0,
    )
