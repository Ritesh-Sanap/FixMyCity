# FixMyCity 🇮🇳 — Smart Civic Issue Reporting & Women Safety SOS System
> *“See it. Report it. Fix it.” — Smart India Hackathon 2026 (SIH 2026)*

FixMyCity is a smart civic issue reporting, management, and predictive safety platform designed to empower citizens to report civic hazards (potholes, garbage, broken streetlights, water leakages) and assist municipal authorities in triaging, routing, and resolving them using AI intelligence and real-time GIS tracking.

---

## 🚀 Key Features

1. **🏛️ Citizen Grievance Redressal Portal**:
   - Camera photo upload & direct file capture.
   - AI Automated Issue Categorization & Priority Scoring.
   - Live GPS geo-tagging & address detection.
   - Multilingual Support across **11 Indian Languages** (English, मराठी, हिन्दी, ગુજરાતી, বাংলা, தமிழ், తెలుగు, ಕನ್ನಡ, മലയാളം, ਪੰਜਾਬੀ, اردو).
   - Citizen Verification on completion (*"Yes, Fixed" / "Still Unresolved"*).

2. **🚨 Women Safety Emergency SOS & Preventive Intelligence**:
   - **One-Tap Emergency SOS** with live GPS broadcast to family contacts and municipal authorities.
   - **Predictive Safety Map**: Derives safety risk zones from civic complaint density (e.g. broken streetlights & unlit roads).
   - **Direct Helplines**: Quick access to `112` (National SOS), `1091` (Women Helpline), `100` (Police).

3. **🏛️ Officer Command Center & GIS Dashboard**:
   - Real-time KPI metrics (Critical, High, Resolved, Pending).
   - Interactive Leaflet Civic Map with priority-colored pins.
   - Automated Department Routing (Roads, Electrical, Sanitation, Water Supply).
   - Active Emergency SOS Broadcast monitoring.
   - Predictive Intelligence: Municipal Ward Risk Heatmaps.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Zustand, React-Leaflet, Lucide Icons
- **Backend**: FastAPI (Python 3), SQLAlchemy ORM, SQLite / PostgreSQL, Pydantic, Argon2-cffi, JWT Auth
- **AI & ML Engine**: Computer Vision classification layer, Haversine + Jaccard duplicate detector, Multi-factor priority engine

---

## 📦 Local Development Setup

### 1. Backend (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python database/seed.py
uvicorn app.main:app --reload --port 8000
```
API Documentation available at: `http://localhost:8000/docs`

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Application accessible at: `http://localhost:5173`

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| 🧑 Citizen | `rahul@gmail.com` | `citizen123` |
| 🏛️ Officer | `officer1@fixmycity.in` | `officer123` |
| 🔑 Admin | `admin@fixmycity.in` | `admin123` |

---

## 🌐 Deployment Guide

- **Frontend**: Deploy on [Vercel](https://vercel.com) using the `frontend` directory.
- **Backend**: Deploy on [Render](https://render.com) or [Railway](https://railway.app) using the `backend` directory.
