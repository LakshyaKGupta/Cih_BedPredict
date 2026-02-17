"""
Public Patient API Router

Patient-safe endpoints that expose only aggregated prediction data.
No raw EHR data is exposed. Accessible to PATIENT role.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import date, timedelta
from app.database import get_db
from app.models.hospital import Hospital, EHRRecord
from app.services.prediction_service import PredictionService
from app.schemas.public import (
    PublicHospitalInfo,
    HospitalAvailability,
    HospitalForecast,
    DayForecast,
    HospitalComparison,
    CityRecommendation,
    AvailabilityAlert,
    AlertsResponse
)

router = APIRouter(prefix="/public", tags=["Public Patient API"])
prediction_service = PredictionService()


def _clamp_occupancy(occupied_beds: int, total_beds: int) -> int:
    """Clamp occupancy to a valid range for patient-facing outputs."""
    if total_beds <= 0:
        return max(0, int(occupied_beds or 0))
    return max(0, min(int(occupied_beds or 0), total_beds))


def _calculate_utilization(occupied_beds: int, total_beds: int) -> float:
    if total_beds <= 0:
        return 0.0
    return round((occupied_beds / total_beds) * 100, 1)


def _risk_from_utilization(utilization: float) -> str:
    if utilization >= 85:
        return "high"
    if utilization >= 70:
        return "medium"
    return "low"


def _build_fallback_forecast(
    ehr_records: List[EHRRecord],
    total_beds: int,
    days: int
) -> List[dict]:
    """
    Lightweight fallback forecast used when Prophet cannot run
    (for example, insufficient historical points).
    """
    if not ehr_records:
        return []

    normalized = [
        _clamp_occupancy(record.occupied_beds, total_beds)
        for record in ehr_records
    ]

    # Use recent deltas to capture direction while keeping projections stable.
    recent = normalized[-8:]
    deltas = [recent[i] - recent[i - 1] for i in range(1, len(recent))]
    avg_delta = (sum(deltas) / len(deltas)) if deltas else 0
    avg_delta = max(-5.0, min(5.0, avg_delta))

    last_day = ehr_records[-1].date
    last_occupancy = normalized[-1]
    predictions = []

    for day_offset in range(1, days + 1):
        projected = _clamp_occupancy(
            round(last_occupancy + (avg_delta * day_offset)),
            total_beds
        )
        predictions.append({
            "date": last_day + timedelta(days=day_offset),
            "predicted_occupancy": projected
        })

    return predictions


def _format_forecast_response(
    predictions: List[dict],
    total_beds: int
) -> tuple[List[DayForecast], Optional[str], Optional[int]]:
    forecast_days: List[DayForecast] = []
    min_occupancy = float("inf")
    best_day: Optional[str] = None

    for pred in predictions:
        predicted_occ = _clamp_occupancy(pred.get("predicted_occupancy", 0), total_beds)
        available = max(0, total_beds - predicted_occ)
        utilization = _calculate_utilization(predicted_occ, total_beds)
        risk = _risk_from_utilization(utilization)
        pred_date = pred.get("date")
        date_str = pred_date.isoformat() if hasattr(pred_date, "isoformat") else str(pred_date)

        if predicted_occ < min_occupancy:
            min_occupancy = predicted_occ
            best_day = date_str

        forecast_days.append(DayForecast(
            date=date_str,
            predicted_occupancy=predicted_occ,
            predicted_available=available,
            utilization_percentage=utilization,
            risk_level=risk
        ))

    best_day_occupancy = int(min_occupancy) if min_occupancy != float("inf") else None
    return forecast_days, best_day, best_day_occupancy


@router.get("/hospitals", response_model=List[PublicHospitalInfo])
async def get_public_hospitals(
    city: Optional[str] = Query(None, description="Filter by city/location"),
    db: Session = Depends(get_db)
):
    """
    Get list of all hospitals (public information only)
    
    Accessible without authentication. Returns basic hospital info.
    """
    query = db.query(Hospital)
    
    if city:
        query = query.filter(Hospital.location.ilike(f"%{city}%"))
    
    hospitals = query.all()
    
    return [PublicHospitalInfo(
        id=h.id,
        hospital_name=h.hospital_name,
        location=h.location,
        total_beds=h.total_beds,
        icu_beds=h.icu_beds
    ) for h in hospitals]


@router.get("/availability/{hospital_id}", response_model=HospitalAvailability)
async def get_hospital_availability(
    hospital_id: int,
    db: Session = Depends(get_db)
):
    """
    Get current bed availability for a hospital
    
    Shows real-time occupancy status without exposing sensitive EHR data.
    """
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found"
        )
    
    # Get latest EHR record for current occupancy
    latest_record = db.query(EHRRecord).filter(
        EHRRecord.hospital_id == hospital_id
    ).order_by(desc(EHRRecord.date)).first()
    
    if not latest_record:
        # Return a response indicating no data instead of 404
        return HospitalAvailability(
            hospital_id=hospital.id,
            hospital_name=hospital.hospital_name,
            location=hospital.location,
            total_beds=hospital.total_beds,
            current_occupied=0,
            current_available=hospital.total_beds,
            utilization_percentage=0.0,
            status="unknown",
            last_updated=None
        )
    
    current_occupied = _clamp_occupancy(latest_record.occupied_beds, hospital.total_beds)
    current_available = max(0, hospital.total_beds - current_occupied)
    utilization = _calculate_utilization(current_occupied, hospital.total_beds)

    # Determine status
    if utilization >= 85:
        status_str = "high"
    elif utilization >= 70:
        status_str = "moderate"
    else:
        status_str = "available"
    
    return HospitalAvailability(
        hospital_id=hospital.id,
        hospital_name=hospital.hospital_name,
        location=hospital.location,
        total_beds=hospital.total_beds,
        current_occupied=current_occupied,
        current_available=current_available,
        utilization_percentage=utilization,
        status=status_str,
        last_updated=latest_record.date.isoformat()
    )


@router.get("/forecast/{hospital_id}", response_model=HospitalForecast)
async def get_hospital_forecast(
    hospital_id: int,
    days: int = Query(7, ge=1, le=14, description="Number of days to forecast"),
    db: Session = Depends(get_db)
):
    """
    Get occupancy forecast for next N days
    
    Uses ML prediction to show expected bed availability.
    Helps patients plan their visit timing.
    """
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found"
        )
    
    # Get all EHR records for prediction
    ehr_records = db.query(EHRRecord).filter(
        EHRRecord.hospital_id == hospital_id
    ).order_by(EHRRecord.date).all()
    
    if len(ehr_records) == 0:
        return HospitalForecast(
            hospital_id=hospital.id,
            hospital_name=hospital.hospital_name,
            location=hospital.location,
            total_beds=hospital.total_beds,
            forecast=[],
            best_day_to_visit=None,
            best_day_occupancy=None
        )

    # Generate predictions. Use Prophet when possible, otherwise fallback.
    if len(ehr_records) >= 14:
        try:
            predictions, _ = prediction_service.predict_occupancy(
                ehr_records=ehr_records,
                days=days
            )
        except Exception:
            predictions = _build_fallback_forecast(ehr_records, hospital.total_beds, days)
    else:
        predictions = _build_fallback_forecast(ehr_records, hospital.total_beds, days)

    forecast_days, best_day, best_day_occupancy = _format_forecast_response(
        predictions=predictions,
        total_beds=hospital.total_beds
    )
    
    return HospitalForecast(
        hospital_id=hospital.id,
        hospital_name=hospital.hospital_name,
        location=hospital.location,
        total_beds=hospital.total_beds,
        forecast=forecast_days,
        best_day_to_visit=best_day,
        best_day_occupancy=best_day_occupancy
    )


@router.get("/compare", response_model=List[HospitalComparison])
async def compare_hospitals(
    city: Optional[str] = Query(None, description="Filter by city"),
    db: Session = Depends(get_db)
):
    """
    Compare hospitals by current and predicted availability
    
    Ranks hospitals to help patients choose the best option.
    """
    query = db.query(Hospital)
    
    if city:
        query = query.filter(Hospital.location.ilike(f"%{city}%"))
    
    hospitals = query.all()
    
    if not hospitals:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hospitals found"
        )
    
    comparisons = []
    
    for hospital in hospitals:
        # Get current occupancy
        latest_record = db.query(EHRRecord).filter(
            EHRRecord.hospital_id == hospital.id
        ).order_by(desc(EHRRecord.date)).first()
        
        if not latest_record:
            continue
        
        current_occ = _clamp_occupancy(latest_record.occupied_beds, hospital.total_beds)
        current_avail = max(0, hospital.total_beds - current_occ)
        utilization = _calculate_utilization(current_occ, hospital.total_beds)
        
        # Get 7-day prediction average
        ehr_records = db.query(EHRRecord).filter(
            EHRRecord.hospital_id == hospital.id
        ).order_by(EHRRecord.date).all()
        
        avg_predicted = current_occ  # Default to current if prediction fails

        if len(ehr_records) >= 14:
            try:
                predictions, _ = prediction_service.predict_occupancy(
                    ehr_records=ehr_records,
                    days=7
                )
                avg_predicted = sum(p['predicted_occupancy'] for p in predictions) / len(predictions)
            except Exception:
                fallback = _build_fallback_forecast(ehr_records, hospital.total_beds, 7)
                if fallback:
                    avg_predicted = sum(p['predicted_occupancy'] for p in fallback) / len(fallback)
        else:
            fallback = _build_fallback_forecast(ehr_records, hospital.total_beds, 7)
            if fallback:
                avg_predicted = sum(p['predicted_occupancy'] for p in fallback) / len(fallback)
        
        # Calculate recommendation score (0-100, higher is better)
        # Lower occupancy = higher score
        availability_score = ((hospital.total_beds - current_occ) / hospital.total_beds) * 50
        future_availability_score = ((hospital.total_beds - avg_predicted) / hospital.total_beds) * 50
        recommendation_score = availability_score + future_availability_score
        
        # Determine risk level
        if utilization >= 85:
            risk = "high"
        elif utilization >= 70:
            risk = "medium"
        else:
            risk = "low"
        
        comparisons.append(HospitalComparison(
            hospital_id=hospital.id,
            hospital_name=hospital.hospital_name,
            location=hospital.location,
            current_occupancy=current_occ,
            current_available=current_avail,
            utilization_percentage=utilization,
            avg_predicted_occupancy_7_days=round(avg_predicted, 1),
            recommendation_score=round(recommendation_score, 1),
            risk_level=risk
        ))
    
    # Sort by recommendation score (highest first)
    comparisons.sort(key=lambda x: x.recommendation_score, reverse=True)
    
    return comparisons


@router.get("/recommendation/{city}", response_model=CityRecommendation)
async def get_city_recommendation(
    city: str,
    db: Session = Depends(get_db)
):
    """
    Get best hospital recommendation for a city
    
    Analyzes all hospitals in a city and recommends the best option
    based on current and predicted availability.
    """
    comparisons = await compare_hospitals(city=city, db=db)
    
    if not comparisons:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No hospitals found in {city}"
        )
    
    best = comparisons[0]
    
    # Generate reason
    if best.risk_level == "low":
        reason = f"{best.hospital_name} has good availability with {best.current_available} beds available ({best.utilization_percentage}% occupied)."
    elif best.risk_level == "medium":
        reason = f"{best.hospital_name} is moderately busy but still accepting patients ({best.utilization_percentage}% occupied)."
    else:
        reason = f"{best.hospital_name} is the best option despite high occupancy. Consider calling ahead."
    
    return CityRecommendation(
        city=city,
        recommended_hospitals=comparisons,
        best_hospital_id=best.hospital_id,
        best_hospital_name=best.hospital_name,
        reason=reason
    )


@router.get("/alerts/{hospital_id}", response_model=AlertsResponse)
async def get_hospital_alerts(
    hospital_id: int,
    db: Session = Depends(get_db)
):
    """
    Get availability alerts for a hospital
    
    Warns patients if hospital is expected to be crowded.
    Suggests alternatives if needed based on risk levels.
    """
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hospital not found"
        )
    
    alerts = []
    has_high_risk = False
    
    # Get predictions
    ehr_records = db.query(EHRRecord).filter(
        EHRRecord.hospital_id == hospital_id
    ).order_by(EHRRecord.date).all()
    
    predictions = []
    if len(ehr_records) >= 14:
        try:
            predictions, _ = prediction_service.predict_occupancy(
                ehr_records=ehr_records,
                days=7
            )
        except Exception:
            predictions = _build_fallback_forecast(ehr_records, hospital.total_beds, 7)
    else:
        predictions = _build_fallback_forecast(ehr_records, hospital.total_beds, 7)

    # Check for high occupancy days
    for pred in predictions:
        predicted_occ = _clamp_occupancy(pred['predicted_occupancy'], hospital.total_beds)
        utilization = _calculate_utilization(predicted_occ, hospital.total_beds)
        date_str = pred['date'].isoformat() if hasattr(pred['date'], 'isoformat') else str(pred['date'])

        # Create alerts for medium and high risk levels
        if utilization >= 85:
            has_high_risk = True
            alerts.append(AvailabilityAlert(
                alert_type="high_occupancy",
                message=f"Critical occupancy expected on {date_str} ({utilization:.0f}%). Long wait times likely. Consider visiting an alternate hospital or a different day.",
                severity="critical",
                date=date_str
            ))
        elif utilization >= 70:
            alerts.append(AvailabilityAlert(
                alert_type="capacity_warning",
                message=f"Moderate occupancy expected on {date_str} ({utilization:.0f}%). May experience longer wait times.",
                severity="warning",
                date=date_str
            ))
    
    # Get alternate hospitals if there are high risk alerts
    alternate_hospitals = []
    if has_high_risk or len(alerts) >= 3:
        # Find hospitals in same location with better availability
        other_hospitals = db.query(Hospital).filter(
            Hospital.location.ilike(f"%{hospital.location.split(',')[0]}%"),
            Hospital.id != hospital_id
        ).all()
        
        # Get current availability for alternates
        for alt_hospital in other_hospitals[:5]:  # Check up to 5 hospitals
            latest_record = db.query(EHRRecord).filter(
                EHRRecord.hospital_id == alt_hospital.id
            ).order_by(desc(EHRRecord.date)).first()
            
            if latest_record:
                alt_occupied = _clamp_occupancy(latest_record.occupied_beds, alt_hospital.total_beds)
                alt_utilization = _calculate_utilization(alt_occupied, alt_hospital.total_beds)
                # Only recommend hospitals with better availability (< 70%)
                if alt_utilization < 70:
                    alternate_hospitals.append(PublicHospitalInfo(
                        id=alt_hospital.id,
                        hospital_name=alt_hospital.hospital_name,
                        location=alt_hospital.location,
                        total_beds=alt_hospital.total_beds,
                        icu_beds=alt_hospital.icu_beds
                    ))
                    if len(alternate_hospitals) >= 3:
                        break
    
    return AlertsResponse(
        hospital_id=hospital.id,
        hospital_name=hospital.hospital_name,
        alerts=alerts,
        alternate_hospitals=alternate_hospitals
    )
