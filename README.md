# Hospital Bed Occupancy Prediction System

Predictive hospital operations software that forecasts bed occupancy and helps reduce patient wait times.

## Live Deployment
- Frontend: https://hospital-bed-management-2026.netlify.app
- Backend API: https://backend-api-production-bf71.up.railway.app
- API docs: https://backend-api-production-bf71.up.railway.app/docs

## What This System Does
- Tracks hospital, EHR, and occupancy data.
- Forecasts near-term bed occupancy using Prophet.
- Generates risk-aware alerts for high utilization windows.
- Supports hospital admin workflows and patient-facing views.

## Core Features
- Multi-hospital management.
- EHR data ingestion and CSV import.
- 7-day occupancy forecasting with confidence bounds.
- Public patient endpoints for availability and recommendations.
- Role-based authentication for admin and patient access.

## Architecture
- Frontend: React + Vite + Tailwind (`frontend/`)
- Backend: FastAPI + SQLAlchemy (`backend/`)
- Database: PostgreSQL
- ML: Prophet (integrated in backend service)

## Tech Stack
- Frontend: React 18, Vite, Axios, Recharts, Tailwind CSS
- Backend: FastAPI, SQLAlchemy, Pydantic, Uvicorn
- ML: Prophet, Pandas, NumPy
- Auth: JWT (`python-jose`), `passlib`
- Hosting: Netlify (frontend), Railway (backend + PostgreSQL)

## Repository Structure
```text
Team_SpiritX_3.14_3/
  backend/
    app/
      main.py
      database.py
      models/
      routers/
      schemas/
      services/
    requirements.txt
    generate_data.py
  frontend/
    src/
      pages/
      components/
      services/
    package.json
```

## Local Development

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### 1) Backend Setup
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hospital_db
SECRET_KEY=replace-with-a-long-random-secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
API_HOST=0.0.0.0
API_PORT=8000
API_RELOAD=True
FRONTEND_URL=http://localhost:5173
```

Run backend:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2) Frontend Setup
```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

### 3) Seed Data (Optional but recommended)
In another terminal:
```bash
cd backend
python generate_data.py
```

## Key API Endpoints

### Health
- `GET /health`

### Public (patient-facing)
- `GET /api/public/hospitals`
- `GET /api/public/availability/{hospital_id}`
- `GET /api/public/forecast/{hospital_id}`
- `GET /api/public/compare`
- `GET /api/public/alerts/{hospital_id}`

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Admin
- `GET /api/hospitals`
- `POST /api/hospitals`
- `POST /api/ehr`
- `GET /api/predict/{hospital_id}`
- `GET /api/dashboard/{hospital_id}`

## Deployment

### Backend (Railway)
1. Create Railway project.
2. Add PostgreSQL service.
3. Add backend service and deploy `backend/`.
4. Set backend variables:
   - `DATABASE_URL`
   - `SECRET_KEY`
   - `ALGORITHM`
   - `ACCESS_TOKEN_EXPIRE_MINUTES`
   - `API_HOST=0.0.0.0`
   - `API_PORT=8000`
   - `API_RELOAD=False`
   - `FRONTEND_URL=<your-netlify-url>`
5. Generate Railway public domain for backend service.

### Frontend (Netlify)
1. Build frontend with backend API URL:
```bash
cd frontend
VITE_API_URL=https://<railway-backend-domain>/api npm run build
```
2. Deploy `frontend/dist` to Netlify production.

## Operations and Maintenance

### Daily/Weekly checks
- Verify backend health: `GET /health`
- Verify frontend can load hospitals list.
- Review backend logs for auth/database errors.
- Confirm EHR ingestion is continuing.

### Data quality checks
- Each active hospital should have recent EHR records.
- For Prophet quality, keep at least 14+ historical records per hospital.
- Investigate negative or implausible occupancy inputs at ingestion.

### Release checklist
- Run backend and frontend locally.
- Verify auth flows (patient/admin).
- Verify forecast endpoint for at least one hospital.
- Build frontend (`npm run build`) with production API URL.
- Confirm CORS `FRONTEND_URL` matches deployed frontend.

### README maintenance policy
Update this README whenever any of the following change:
- API routes, auth rules, or response behavior.
- Environment variables or defaults.
- Deployment URLs or hosting platform.
- Setup steps or required runtime versions.

Recommended PR checklist item:
- "README updated if setup/API/deployment changed."

## Troubleshooting
- `400` on forecast endpoint: hospital likely has insufficient EHR history.
- Frontend cannot reach backend: verify `VITE_API_URL` and backend CORS `FRONTEND_URL`.
- Empty dashboard: seed data or ingest recent EHR records.
- Auth failures: verify `SECRET_KEY`, token expiry settings, and user role.

## Security Notes
- Never commit real secrets in `.env` files.
- Rotate `SECRET_KEY` for production environments.
- Restrict CORS origins to trusted frontend domains only.

## License
MIT
