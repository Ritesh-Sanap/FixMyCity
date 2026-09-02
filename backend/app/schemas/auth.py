from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class RegisterRequest(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str
    ward: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Rahul Sharma",
                "phone": "9876543210",
                "password": "password123",
                "ward": "Ward 12"
            }
        }


class LoginRequest(BaseModel):
    email_or_phone: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str
    role: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: Optional[str]
    phone: Optional[str]
    role: str
    ward: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
