"""
Hospital Management Router

Endpoints:
- POST /api/hospitals - Create a new hospital (Admin only)
- GET /api/hospitals - List all hospitals (Public - no auth required)
- GET /api/hospitals/{hospital_id} - Get specific hospital details (Public - no auth required)
- PUT /api/hospitals/{hospital_id}/api-config - Configure API integration (Admin only)
- POST /api/hospitals/{hospital_id}/sync - Manually trigger API sync (Admin only)
"""

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import httpx
from app.database import get_db
from app.models.hospital import Hospital, EHRRecord
from app.models.user import User
from app.schemas.hospital import (
    HospitalCreate, 
    HospitalResponse, 
    APIIntegrationConfig,
    APISyncResponse
)
from app.services.auth_service import require_hospital_admin

router = APIRouter()


@router.post("/hospitals", response_model=HospitalResponse, status_code=status.HTTP_201_CREATED)
async def create_hospital(
    hospital: HospitalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hospital_admin)
):
    """
    Create a new hospital in the system (Hospital Admin only)
    
    Args:
        hospital: Hospital data including name, location, and bed capacity
        db: Database session
        current_user: Authenticated hospital admin user
        
    Returns:
        Created hospital with assigned ID
    """
    # Validate ICU beds don't exceed total beds
    if hospital.icu_beds > hospital.total_beds:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ICU beds cannot exceed total beds"
        )
    
    # Create new hospital instance
    db_hospital = Hospital(**hospital.model_dump())
    db.add(db_hospital)
    db.commit()
    db.refresh(db_hospital)
    
    return db_hospital


@router.get("/hospitals", response_model=List[HospitalResponse])
async def get_hospitals(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Retrieve all hospitals with pagination
    
    Args:
        skip: Number of records to skip (for pagination)
        limit: Maximum number of records to return
        db: Database session
        
    Returns:
        List of hospitals
    """
    hospitals = db.query(Hospital).offset(skip).limit(limit).all()
    return hospitals


@router.get("/hospitals/{hospital_id}", response_model=HospitalResponse)
async def get_hospital(
    hospital_id: int,
    db: Session = Depends(get_db)
):
    """
    Get specific hospital by ID
    
    Args:
        hospital_id: Hospital ID
        db: Database session
        
    Returns:
        Hospital details
        
    Raises:
        404: Hospital not found
    """
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital with ID {hospital_id} not found"
        )
    
    return hospital


@router.put("/hospitals/{hospital_id}", response_model=HospitalResponse)
async def update_hospital(
    hospital_id: int,
    hospital_update: HospitalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hospital_admin)
):
    """
    Update hospital information (Admin only)
    
    Args:
        hospital_id: Hospital ID to update
        hospital_update: Updated hospital data
        db: Database session
        current_user: Authenticated hospital admin
        
    Returns:
        Updated hospital details
        
    Raises:
        404: Hospital not found
        400: Validation error
    """
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital with ID {hospital_id} not found"
        )
    
    # Validate ICU beds don't exceed total beds
    if hospital_update.icu_beds > hospital_update.total_beds:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ICU beds cannot exceed total beds"
        )
    
    # Update hospital fields
    hospital.hospital_name = hospital_update.hospital_name
    hospital.location = hospital_update.location
    hospital.total_beds = hospital_update.total_beds
    hospital.icu_beds = hospital_update.icu_beds
    
    db.commit()
    db.refresh(hospital)
    
    return hospital


@router.put("/hospitals/{hospital_id}/api-config", response_model=HospitalResponse)
async def configure_hospital_api(
    hospital_id: int,
    config: APIIntegrationConfig,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hospital_admin)
):
    """
    Configure API integration for a hospital (Admin only)
    
    Allows hospitals to integrate their EHR system API for real-time data sync
    
    Args:
        hospital_id: Hospital ID
        config: API configuration including endpoint, key, webhook
        db: Database session
        current_user: Authenticated hospital admin
        
    Returns:
        Updated hospital with API configuration
    """
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital with ID {hospital_id} not found"
        )
    
    # Update API configuration
    hospital.api_enabled = config.api_enabled
    hospital.api_endpoint = config.api_endpoint
    hospital.api_key = config.api_key  # In production, encrypt this!
    hospital.webhook_url = config.webhook_url
    hospital.sync_interval = config.sync_interval
    hospital.api_notes = config.api_notes
    
    db.commit()
    db.refresh(hospital)
    
    return hospital


@router.post("/hospitals/{hospital_id}/sync", response_model=APISyncResponse)
async def sync_hospital_data(
    hospital_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hospital_admin)
):
    """
    Manually trigger API sync for a hospital (Admin only)
    
    Fetches latest bed occupancy data from hospital's API endpoint
    
    Args:
        hospital_id: Hospital ID
        background_tasks: FastAPI background tasks
        db: Database session
        current_user: Authenticated hospital admin
        
    Returns:
        Sync status and records count
    """
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital with ID {hospital_id} not found"
        )
    
    if not hospital.api_enabled or not hospital.api_endpoint:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="API integration is not configured for this hospital"
        )
    
    try:
        # Make API request to hospital's endpoint
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {}
            if hospital.api_key:
                headers["Authorization"] = f"Bearer {hospital.api_key}"
            
            response = await client.get(hospital.api_endpoint, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            # Expected format: { "date": "2026-01-31", "occupied_beds": 150, "icu_occupied": 20, ... }
            # Create or update EHR record
            today = datetime.utcnow().date()
            existing_record = db.query(EHRRecord).filter(
                EHRRecord.hospital_id == hospital_id,
                EHRRecord.date == today
            ).first()
            
            if existing_record:
                # Update existing record
                existing_record.occupied_beds = data.get("occupied_beds", existing_record.occupied_beds)
                existing_record.icu_occupied = data.get("icu_occupied", existing_record.icu_occupied)
                existing_record.admissions = data.get("admissions", existing_record.admissions)
                existing_record.discharges = data.get("discharges", existing_record.discharges)
                existing_record.emergency_cases = data.get("emergency_cases", existing_record.emergency_cases)
            else:
                # Create new record
                new_record = EHRRecord(
                    hospital_id=hospital_id,
                    date=today,
                    occupied_beds=data.get("occupied_beds", 0),
                    icu_occupied=data.get("icu_occupied", 0),
                    admissions=data.get("admissions", 0),
                    discharges=data.get("discharges", 0),
                    emergency_cases=data.get("emergency_cases", 0)
                )
                db.add(new_record)
            
            # Update last sync timestamp
            hospital.last_sync = datetime.utcnow()
            db.commit()
            
            return APISyncResponse(
                success=True,
                message="Data synced successfully",
                records_synced=1,
                last_sync=hospital.last_sync
            )
            
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch data from hospital API: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Sync failed: {str(e)}"
        )
