"""
EHR (Electronic Health Records) Router

Endpoints:
- POST /api/ehr - Create a new EHR daily record (Admin only)
- GET /api/ehr/{hospital_id} - Get all EHR records for a hospital (Admin only)
- GET /api/ehr/{hospital_id}/latest - Get most recent EHR record (Admin only)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import date
from app.database import get_db
from app.models.hospital import Hospital, EHRRecord
from app.models.user import User
from app.schemas.hospital import EHRRecordCreate, EHRRecordResponse
from app.services.auth_service import require_hospital_admin

router = APIRouter()


@router.post("/ehr", response_model=EHRRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_ehr_record(
    ehr: EHRRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hospital_admin)
):
    """
    Create a new EHR daily record for a hospital (Hospital Admin only)
    
    Args:
        ehr: EHR record data including admissions, discharges, occupancy
        db: Database session
        current_user: Authenticated hospital admin user
        
    Returns:
        Created EHR record
        
    Raises:
        404: Hospital not found
        400: Validation errors
    """
    # Check if hospital exists
    hospital = db.query(Hospital).filter(Hospital.id == ehr.hospital_id).first()
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital with ID {ehr.hospital_id} not found"
        )
    
    # Validate occupied beds don't exceed total beds
    if ehr.occupied_beds > hospital.total_beds:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Occupied beds ({ehr.occupied_beds}) cannot exceed total beds ({hospital.total_beds})"
        )
    
    # Validate ICU occupied don't exceed ICU capacity
    if ehr.icu_occupied > hospital.icu_beds:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"ICU occupied ({ehr.icu_occupied}) cannot exceed ICU beds ({hospital.icu_beds})"
        )
    
    # Check for duplicate record (same hospital and date)
    existing = db.query(EHRRecord).filter(
        EHRRecord.hospital_id == ehr.hospital_id,
        EHRRecord.date == ehr.date
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"EHR record for hospital {ehr.hospital_id} on {ehr.date} already exists"
        )
    
    # Create new EHR record
    db_ehr = EHRRecord(**ehr.model_dump())
    db.add(db_ehr)
    db.commit()
    db.refresh(db_ehr)
    
    return db_ehr


@router.get("/ehr/{hospital_id}/simple")
async def get_ehr_records_simple(
    hospital_id: int,
    db: Session = Depends(get_db)
):
    """Simple endpoint to get EHR records without complex validation"""
    try:
        records = db.query(EHRRecord).filter(
            EHRRecord.hospital_id == hospital_id
        ).order_by(desc(EHRRecord.date)).limit(30).all()
        
        return [
            {
                "id": r.id,
                "hospital_id": r.hospital_id,
                "date": r.date.isoformat() if r.date else None,
                "admissions": r.admissions,
                "discharges": r.discharges,
                "occupied_beds": r.occupied_beds,
                "icu_occupied": r.icu_occupied,
                "emergency_cases": r.emergency_cases,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in records
        ]
    except Exception as e:
        print(f"Error in simple EHR endpoint: {e}")
        return []


@router.get("/ehr/{hospital_id}", response_model=List[EHRRecordResponse])
async def get_ehr_records(
    hospital_id: int,
    skip: int = 0,
    limit: int = 365,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hospital_admin)
):
    """
    Get all EHR records for a specific hospital (Hospital Admin only)
    
    Args:
        hospital_id: Hospital ID
        skip: Number of records to skip
        current_user: Authenticated hospital admin user
        limit: Maximum records to return (default 365 days)
        db: Database session
        
    Returns:
        List of EHR records ordered by date (newest first)
        
    Raises:
        404: Hospital not found
    """
    # Check if hospital exists
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital with ID {hospital_id} not found"
        )
    
    # Get EHR records
    records = db.query(EHRRecord).filter(
        EHRRecord.hospital_id == hospital_id
    ).order_by(desc(EHRRecord.date)).offset(skip).limit(limit).all()
    
    return records


@router.get("/ehr/{hospital_id}/latest", response_model=EHRRecordResponse)
async def get_latest_ehr_record(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hospital_admin)
):
    """
    Get the most recent EHR record for a hospital (Hospital Admin only)
    
    Args:
        hospital_id: Hospital ID
        db: Database session
        current_user: Authenticated hospital admin user
        
    Returns:
        Most recent EHR record
        
    Raises:
        404: Hospital or records not found
    """
    # Check if hospital exists
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital with ID {hospital_id} not found"
        )
    
    # Get latest record
    record = db.query(EHRRecord).filter(
        EHRRecord.hospital_id == hospital_id
    ).order_by(desc(EHRRecord.date)).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No EHR records found for hospital {hospital_id}"
        )
    
    return record
