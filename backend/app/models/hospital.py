"""
Database Models for Hospital Management System

This module defines SQLAlchemy ORM models for:
- Hospital: Core hospital information and bed capacity
- EHRRecord: Daily electronic health records with admission/discharge data
"""

from sqlalchemy import Column, Integer, String, Date, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Hospital(Base):
    """
    Hospital Model
    Stores hospital information and bed capacity details
    """
    __tablename__ = "hospitals"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_name = Column(String, nullable=False, index=True)
    location = Column(String, nullable=False)
    total_beds = Column(Integer, nullable=False)
    icu_beds = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # API Integration fields for real-time sync
    api_enabled = Column(Boolean, default=False, nullable=False)
    api_endpoint = Column(String, nullable=True)  # Hospital's API endpoint URL
    api_key = Column(String, nullable=True)  # Encrypted API key for authentication
    webhook_url = Column(String, nullable=True)  # Webhook for push notifications
    sync_interval = Column(Integer, default=300, nullable=False)  # Sync interval in seconds (default 5 min)
    last_sync = Column(DateTime, nullable=True)  # Last successful sync timestamp
    api_notes = Column(Text, nullable=True)  # Additional notes about API integration
    
    # Relationship to EHR records
    ehr_records = relationship("EHRRecord", back_populates="hospital", cascade="all, delete-orphan")
    
    # Relationship to users (hospital admins) - commented out to fix circular import
    # users = relationship("User", back_populates="hospital")
    
    def __repr__(self):
        return f"<Hospital {self.hospital_name} - {self.location}>"


class EHRRecord(Base):
    """
    EHR (Electronic Health Record) Daily Data Model
    Stores daily operational metrics for hospital bed management
    
    Key metrics:
    - admissions: New patients admitted
    - discharges: Patients discharged
    - occupied_beds: Total beds currently occupied
    - icu_occupied: ICU beds currently occupied
    - emergency_cases: Emergency admissions
    """
    __tablename__ = "ehr_records"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    admissions = Column(Integer, nullable=False, default=0)
    discharges = Column(Integer, nullable=False, default=0)
    occupied_beds = Column(Integer, nullable=False)
    icu_occupied = Column(Integer, nullable=False, default=0)
    emergency_cases = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship to hospital
    hospital = relationship("Hospital", back_populates="ehr_records")
    
    def __repr__(self):
        return f"<EHRRecord Hospital:{self.hospital_id} Date:{self.date}>"
    
    @property
    def utilization_rate(self):
        """Calculate bed utilization percentage"""
        if self.hospital and self.hospital.total_beds > 0:
            return (self.occupied_beds / self.hospital.total_beds) * 100
        return 0.0
