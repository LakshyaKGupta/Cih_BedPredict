"""
Predictions and Analytics Router

Endpoints:
- GET /api/predict/{hospital_id} - Generate bed occupancy predictions (Admin only)
- GET /api/dashboard/{hospital_id} - Complete dashboard data with analytics (Admin only)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import date, timedelta
from app.database import get_db
from app.models.hospital import Hospital, EHRRecord
from app.models.user import User
from app.schemas.hospital import (
    PredictionResponse,
    PredictionPoint,
    DashboardResponse,
    AlertItem
)
from app.services.prediction_service import prediction_service
from app.services.auth_service import require_hospital_admin

router = APIRouter()


def _clamp_occupancy(value: float, total_beds: int) -> float:
    if total_beds <= 0:
        return max(0.0, float(value or 0))
    return max(0.0, min(float(value or 0), float(total_beds)))


def _build_fallback_predictions(ehr_records: List[EHRRecord], total_beds: int, days: int) -> List[dict]:
    """
    Fallback predictor used when Prophet can't train (for example <14 records).
    Uses recent trend with conservative confidence bounds.
    """
    if not ehr_records:
        return []

    normalized = [_clamp_occupancy(record.occupied_beds, total_beds) for record in ehr_records]
    recent = normalized[-8:]
    deltas = [recent[i] - recent[i - 1] for i in range(1, len(recent))]
    avg_delta = (sum(deltas) / len(deltas)) if deltas else 0.0
    avg_delta = max(-5.0, min(5.0, avg_delta))

    last_day = ehr_records[-1].date
    last_occupancy = normalized[-1]
    predictions = []

    for offset in range(1, days + 1):
        predicted = _clamp_occupancy(last_occupancy + (avg_delta * offset), total_beds)
        lower = _clamp_occupancy(predicted - 8, total_beds)
        upper = _clamp_occupancy(predicted + 8, total_beds)
        predictions.append({
            "date": last_day + timedelta(days=offset),
            "predicted_occupancy": round(predicted, 1),
            "lower_bound": round(lower, 1),
            "upper_bound": round(upper, 1),
        })

    return predictions


@router.get("/predict/{hospital_id}", response_model=PredictionResponse)
async def predict_occupancy(
    hospital_id: int,
    days: int = Query(default=7, ge=1, le=30, description="Number of days to predict"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hospital_admin)
):
    """
    Generate bed occupancy predictions for a hospital (Hospital Admin only)
    
    Uses Prophet time-series forecasting to predict future bed occupancy
    based on historical EHR data.
    
    Args:
        hospital_id: Hospital ID
        current_user: Authenticated hospital admin user
        days: Number of days to predict (1-30, default 7)
        db: Database session
        
    Returns:
        Predictions with confidence intervals and model metadata
        
    Raises:
        404: Hospital not found
        400: Insufficient historical data
    """
    # Get hospital
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital with ID {hospital_id} not found"
        )
    
    # Get historical EHR records
    ehr_records = db.query(EHRRecord).filter(
        EHRRecord.hospital_id == hospital_id
    ).order_by(EHRRecord.date).all()

    if len(ehr_records) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No EHR records found for hospital {hospital_id}"
        )
    
    try:
        # Use Prophet for >=14 records, otherwise fallback predictor
        if len(ehr_records) >= 14:
            predictions, model_info = prediction_service.predict_occupancy(
                ehr_records=ehr_records,
                days=days
            )
        else:
            predictions = _build_fallback_predictions(ehr_records, hospital.total_beds, days)
            model_info = {
                "model": "fallback_trend",
                "history_points": len(ehr_records),
                "note": "Insufficient history for Prophet. Using trend-based fallback forecast."
            }
        
        # Convert to response format
        prediction_points = [
            PredictionPoint(**pred) for pred in predictions
        ]
        
        return PredictionResponse(
            hospital_id=hospital.id,
            hospital_name=hospital.hospital_name,
            total_beds=hospital.total_beds,
            predictions=prediction_points,
            model_info=model_info
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )


@router.get("/dashboard/{hospital_id}", response_model=DashboardResponse)
async def get_dashboard(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_hospital_admin)
):
    """
    Get complete dashboard data for a hospital (Hospital Admin only)
    
    Provides:
    - Current hospital metrics
    - Historical occupancy data (last 30 days)
    - 7-day predictions
    - Alerts for high occupancy
    - Overall status assessment
    
    Args:
        hospital_id: Hospital ID
        db: Database session
        current_user: Authenticated hospital admin user
        
    Returns:
        Complete dashboard data
        
    Raises:
        404: Hospital not found
        400: Insufficient data
    """
    # Get hospital
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hospital with ID {hospital_id} not found"
        )
    
    # Get latest EHR record for current metrics
    latest_record = db.query(EHRRecord).filter(
        EHRRecord.hospital_id == hospital_id
    ).order_by(desc(EHRRecord.date)).first()
    
    if not latest_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No EHR records found for hospital {hospital_id}"
        )
    
    # Calculate current utilization
    current_utilization = (latest_record.occupied_beds / hospital.total_beds) * 100
    
    # Get historical data (last 30 days)
    thirty_days_ago = date.today() - timedelta(days=30)
    historical_records = db.query(EHRRecord).filter(
        EHRRecord.hospital_id == hospital_id,
        EHRRecord.date >= thirty_days_ago
    ).order_by(EHRRecord.date).all()
    
    # Format historical data
    historical_data = [
        {
            'date': record.date.isoformat(),
            'occupied_beds': record.occupied_beds,
            'admissions': record.admissions,
            'discharges': record.discharges,
            'icu_occupied': record.icu_occupied,
            'emergency_cases': record.emergency_cases,
            'utilization': (record.occupied_beds / hospital.total_beds) * 100
        }
        for record in historical_records
    ]
    
    # Generate predictions (7 days)
    predictions = []
    alerts = []
    
    try:
        # Get all records for prediction
        all_records = db.query(EHRRecord).filter(
            EHRRecord.hospital_id == hospital_id
        ).order_by(EHRRecord.date).all()
        
        if len(all_records) >= 14:
            pred_data, _ = prediction_service.predict_occupancy(
                ehr_records=all_records,
                days=7
            )
        else:
            pred_data = _build_fallback_predictions(all_records, hospital.total_beds, 7)

        # Convert predictions
        predictions = [
            PredictionPoint(**pred) for pred in pred_data
        ]

        # Generate alerts
        alert_data = prediction_service.generate_alerts(
            predictions=pred_data,
            total_beds=hospital.total_beds,
            hospital_name=hospital.hospital_name
        )
        alerts = [AlertItem(**alert) for alert in alert_data]
    
    except Exception as e:
        # If prediction fails, use fallback predictor instead of returning empty
        print(f"Prediction error: {str(e)}")
        fallback_data = _build_fallback_predictions(all_records, hospital.total_beds, 7)
        predictions = [PredictionPoint(**pred) for pred in fallback_data]
        fallback_alerts = prediction_service.generate_alerts(
            predictions=fallback_data,
            total_beds=hospital.total_beds,
            hospital_name=hospital.hospital_name
        )
        alerts = [AlertItem(**alert) for alert in fallback_alerts]
    
    # Determine overall status
    if alerts:
        # Check if any red alerts
        has_red = any(alert.severity == 'red' for alert in alerts)
        has_yellow = any(alert.severity == 'yellow' for alert in alerts)
        
        if has_red:
            overall_status = 'red'
        elif has_yellow:
            overall_status = 'yellow'
        else:
            overall_status = 'green'
    else:
        # Base on current utilization
        if current_utilization >= 85:
            overall_status = 'red'
        elif current_utilization >= 70:
            overall_status = 'yellow'
        else:
            overall_status = 'green'
    
    return DashboardResponse(
        hospital_id=hospital.id,
        hospital_name=hospital.hospital_name,
        location=hospital.location,
        total_beds=hospital.total_beds,
        icu_beds=hospital.icu_beds,
        current_occupied=latest_record.occupied_beds,
        current_icu_occupied=latest_record.icu_occupied,
        current_utilization=round(current_utilization, 1),
        historical_data=historical_data,
        predictions=predictions,
        alerts=alerts,
        overall_status=overall_status
    )
