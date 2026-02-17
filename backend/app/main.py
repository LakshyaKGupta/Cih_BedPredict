"""
Hospital Bed Occupancy Prediction System
FastAPI Main Application

This is the entry point for the hospital management and prediction API.
It handles:
- CORS configuration for frontend communication
- Database initialization
- Router registration
- Health check endpoints
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from app.database import init_db
from app.routers import hospitals, ehr, predictions, auth, public

# Load environment variables
load_dotenv()

# Import all models to ensure they're registered with SQLAlchemy
from app.models.hospital import Hospital, EHRRecord
from app.models.user import User

# Initialize database
init_db()

# Initialize FastAPI app
app = FastAPI(
    title="Hospital Bed Occupancy Prediction API",
    description="Predictive software for hospital bed occupancy using EHR data to reduce patient wait times",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)
@app.on_event("startup")
def startup_event():
    print("✅ Application started successfully")

# Note: Database tables should be created manually or via migration scripts
# To initialize: run `python -c "from app.database import engine, Base; from app.models import *; Base.metadata.create_all(bind=engine)"`

# Get allowed origins from environment
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = [FRONTEND_URL]

# In development, allow localhost variants
if "localhost" in FRONTEND_URL:
    allowed_origins.extend([
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:54128",
        "http://localhost:54128"
    ])

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(public.router, prefix="/api", tags=["Public Patient API"])
app.include_router(hospitals.router, prefix="/api", tags=["Hospitals"])
app.include_router(ehr.router, prefix="/api", tags=["EHR Records"])
app.include_router(predictions.router, prefix="/api", tags=["Predictions & Analytics"])

@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "message": "Hospital Bed Occupancy Prediction API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {"status": "healthy"}
