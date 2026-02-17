"""
Public Patient API Schemas

Pydantic models for patient-facing endpoints.
Aggregated and anonymized data only - no raw EHR exposure.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import date


class PublicHospitalInfo(BaseModel):
    """Public hospital information"""
    id: int
    hospital_name: str
    location: str
    total_beds: int
    icu_beds: int
    
    class Config:
        from_attributes = True


class HospitalAvailability(BaseModel):
    """Current availability status for a hospital"""
    hospital_id: int
    hospital_name: str
    location: str
    total_beds: int
    current_occupied: int
    current_available: int
    utilization_percentage: float
    status: str  # "available", "moderate", "high", "unknown"
    last_updated: Optional[str] = None


class DayForecast(BaseModel):
    """Single day occupancy forecast"""
    date: str
    predicted_occupancy: int
    predicted_available: int
    utilization_percentage: float
    risk_level: str  # "low", "medium", "high"


class HospitalForecast(BaseModel):
    """7-day forecast for a hospital"""
    hospital_id: int
    hospital_name: str
    location: str
    total_beds: int
    forecast: List[DayForecast]
    best_day_to_visit: Optional[str] = None  # Date with lowest occupancy
    best_day_occupancy: Optional[int] = None


class HospitalComparison(BaseModel):
    """Hospital comparison for decision making"""
    hospital_id: int
    hospital_name: str
    location: str
    current_occupancy: int
    current_available: int
    utilization_percentage: float
    avg_predicted_occupancy_7_days: float
    recommendation_score: float  # 0-100, higher is better
    risk_level: str


class CityRecommendation(BaseModel):
    """Best hospitals to visit in a city"""
    city: str
    recommended_hospitals: List[HospitalComparison]
    best_hospital_id: int
    best_hospital_name: str
    reason: str


class AvailabilityAlert(BaseModel):
    """Individual alert for high occupancy"""
    alert_type: str  # "high_occupancy", "capacity_warning"
    message: str
    severity: str  # "warning", "critical"
    date: str


class AlertsResponse(BaseModel):
    """Response containing alerts and alternate hospitals"""
    hospital_id: int
    hospital_name: str
    alerts: List[AvailabilityAlert]
    alternate_hospitals: List[PublicHospitalInfo] = Field(default_factory=list)
