from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    secret_key: str = "fixmycity-super-secret-key-change-in-production"
    database_url: str = "sqlite:///./fixmycity.db"
    upload_dir: str = "uploads"
    access_token_expire_minutes: int = 1440
    algorithm: str = "HS256"

    # Priority Engine Weights
    severity_weight: float = 0.30
    report_count_weight: float = 0.25
    days_unresolved_weight: float = 0.20
    location_importance_weight: float = 0.15
    public_safety_weight: float = 0.10

    # Duplicate Detection
    duplicate_distance_meters: float = 200.0
    duplicate_time_days: int = 30
    duplicate_text_similarity_threshold: float = 0.25

    # Department Routing (category → department name)
    department_routing: dict = {
        "pothole": "Roads Department",
        "damaged_road": "Roads Department",
        "garbage": "Sanitation Department",
        "water_leakage": "Water Department",
        "broken_streetlight": "Electrical Department",
    }

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
