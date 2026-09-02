from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.database import create_tables
from app.config import settings
from app.api import auth, complaints, civic_issues, dashboard, uploads, sos

app = FastAPI(
    title="FixMyCity API",
    description="Smart Civic Issue Reporting & Management Platform — SIH 2026",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static uploads directory
os.makedirs(settings.upload_dir, exist_ok=True)

# Register routers
app.include_router(auth.router)
app.include_router(complaints.router)
app.include_router(civic_issues.router)
app.include_router(dashboard.router)
app.include_router(uploads.router)
app.include_router(sos.router)  # NEW: Women Safety SOS


@app.on_event("startup")
def on_startup():
    create_tables()
    print("✅ FixMyCity API started — DB tables created")
    print("📖 API docs: http://localhost:8000/docs")


@app.get("/")
def root():
    return {
        "app": "FixMyCity",
        "tagline": "See it. Report it. Fix it.",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
