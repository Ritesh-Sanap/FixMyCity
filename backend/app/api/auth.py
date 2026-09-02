from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.dependencies import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _generate_complaint_number(count: int) -> str:
    return f"FMC-2026-{count:04d}"


@router.post("/register", response_model=TokenResponse)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check duplicate
    if req.email and db.query(User).filter(User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    if req.phone and db.query(User).filter(User.phone == req.phone).first():
        raise HTTPException(status_code=400, detail="Phone already registered")

    user = User(
        name=req.name,
        email=req.email,
        phone=req.phone,
        password_hash=hash_password(req.password),
        ward=req.ward,
        role=UserRole.citizen,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return TokenResponse(access_token=token, user_id=user.id, name=user.name, role=user.role.value)


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User).filter(User.email == req.email_or_phone).first()
        or db.query(User).filter(User.phone == req.email_or_phone).first()
    )
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account disabled")

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return TokenResponse(access_token=token, user_id=user.id, name=user.name, role=user.role.value)


@router.post("/officer-login", response_model=TokenResponse)
def officer_login(req: LoginRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User).filter(User.email == req.email_or_phone).first()
        or db.query(User).filter(User.phone == req.email_or_phone).first()
    )
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.role not in (UserRole.officer, UserRole.admin):
        raise HTTPException(status_code=403, detail="Officer access required")

    token = create_access_token({"sub": user.id, "role": user.role.value})
    return TokenResponse(access_token=token, user_id=user.id, name=user.name, role=user.role.value)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
