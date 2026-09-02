"""
Department Router — Configurable Routing Table
===============================================
Maps civic issue categories to responsible departments.
Routing is stored in config (not hardcoded) and can be overridden
via the departments table in the database.
"""
from app.config import settings


def route_to_department_name(category: str) -> str:
    """Return the department name for a given category."""
    return settings.department_routing.get(category, "General Administration")


def route_to_department(category: str, departments: list) -> object | None:
    """
    Return the Department ORM object for a given category.

    Args:
        departments: All Department ORM objects from the DB.
    """
    target_name = route_to_department_name(category)
    for dept in departments:
        if dept.name.lower() == target_name.lower():
            return dept
        # Also check category_mapping in dept
        if category in (dept.category_mapping or []):
            return dept
    return None
