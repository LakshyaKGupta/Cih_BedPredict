"""
Synthetic EHR Data Generator

This script generates realistic synthetic hospital data for testing and demo.
Creates:
- Sample hospitals
- 60 days of historical EHR records with realistic patterns

Run this after database is set up to populate initial data.
"""

import requests
from datetime import date, timedelta
import random
from typing import List, Dict

# API base URL
BASE_URL = "http://localhost:8000/api"


def generate_hospitals() -> List[Dict]:
    """Generate sample hospital data"""
    hospitals = [
        {
            "hospital_name": "Apollo Hospitals",
            "location": "Mumbai, Maharashtra",
            "total_beds": 250,
            "icu_beds": 30
        },
        {
            "hospital_name": "Fortis Healthcare",
            "location": "Delhi, NCR",
            "total_beds": 180,
            "icu_beds": 25
        },
        {
            "hospital_name": "Max Super Speciality Hospital",
            "location": "Bangalore, Karnataka",
            "total_beds": 320,
            "icu_beds": 40
        },
        {
            "hospital_name": "AIIMS Hospital",
            "location": "Hyderabad, Telangana",
            "total_beds": 150,
            "icu_beds": 20
        }
    ]
    return hospitals


def create_hospital(hospital_data: Dict) -> int:
    """Create a hospital and return its ID"""
    response = requests.post(f"{BASE_URL}/hospitals", json=hospital_data)
    if response.status_code == 201:
        hospital = response.json()
        print(f"✓ Created hospital: {hospital['hospital_name']} (ID: {hospital['id']})")
        return hospital['id']
    else:
        print(f"✗ Failed to create hospital: {response.text}")
        return None


def generate_ehr_data(hospital_id: int, total_beds: int, icu_beds: int, days: int = 60):
    """
    Generate realistic EHR data with patterns:
    - Gradual trend (increase or decrease over time)
    - Weekly seasonality (lower on weekends)
    - Random variation (realistic daily fluctuations)
    """
    
    # Base occupancy rate (70-85% of capacity)
    base_occupancy_rate = random.uniform(0.70, 0.85)
    base_occupancy = int(total_beds * base_occupancy_rate)
    
    # Trend: slight increase or decrease over time
    trend_direction = random.choice([-1, 1])
    trend_magnitude = random.uniform(0.05, 0.15)
    
    start_date = date.today() - timedelta(days=days)
    
    for day in range(days):
        current_date = start_date + timedelta(days=day)
        
        # Calculate trend effect (gradual change)
        trend_effect = int(base_occupancy * trend_magnitude * trend_direction * (day / days))
        
        # Weekly seasonality (lower on weekends)
        weekday = current_date.weekday()
        if weekday >= 5:  # Weekend
            seasonal_effect = random.randint(-15, -5)
        else:  # Weekday
            seasonal_effect = random.randint(-5, 10)
        
        # Random daily variation
        random_variation = random.randint(-8, 12)
        
        # Calculate occupied beds
        occupied = base_occupancy + trend_effect + seasonal_effect + random_variation
        occupied = max(int(total_beds * 0.5), min(occupied, total_beds - 5))  # Keep realistic bounds
        
        # ICU occupancy (60-80% of ICU capacity)
        icu_occupied = int(icu_beds * random.uniform(0.60, 0.80))
        
        # Admissions and discharges (balanced around occupancy change)
        if day > 0:
            occupancy_change = occupied - previous_occupied
            admissions = max(5, int(occupied * 0.15) + max(0, occupancy_change) + random.randint(-3, 5))
            discharges = admissions - occupancy_change + random.randint(-2, 2)
            discharges = max(0, discharges)
        else:
            admissions = random.randint(15, 30)
            discharges = random.randint(10, 25)
        
        # Emergency cases (5-15% of admissions)
        emergency = int(admissions * random.uniform(0.05, 0.15))
        
        # Create EHR record
        ehr_data = {
            "hospital_id": hospital_id,
            "date": current_date.isoformat(),
            "admissions": admissions,
            "discharges": discharges,
            "occupied_beds": occupied,
            "icu_occupied": icu_occupied,
            "emergency_cases": emergency
        }
        
        response = requests.post(f"{BASE_URL}/ehr", json=ehr_data)
        if response.status_code == 201:
            print(f"  ✓ Created EHR record for {current_date}")
        else:
            print(f"  ✗ Failed to create EHR record: {response.text}")
        
        previous_occupied = occupied


def main():
    """Main data generation workflow"""
    print("=" * 60)
    print("Hospital Bed Occupancy System - Data Generator")
    print("=" * 60)
    print()
    
    print("Step 1: Creating hospitals...")
    hospitals = generate_hospitals()
    hospital_ids = []
    
    for hospital_data in hospitals:
        hospital_id = create_hospital(hospital_data)
        if hospital_id:
            hospital_ids.append({
                'id': hospital_id,
                'total_beds': hospital_data['total_beds'],
                'icu_beds': hospital_data['icu_beds']
            })
    
    print()
    print("Step 2: Generating EHR data (60 days)...")
    for hospital in hospital_ids:
        print(f"\nGenerating data for Hospital ID {hospital['id']}...")
        generate_ehr_data(
            hospital_id=hospital['id'],
            total_beds=hospital['total_beds'],
            icu_beds=hospital['icu_beds'],
            days=60
        )
    
    print()
    print("=" * 60)
    print("✓ Data generation complete!")
    print("=" * 60)
    print()
    print("You can now:")
    print(f"- View hospitals: {BASE_URL}/hospitals")
    print(f"- View dashboard: {BASE_URL}/dashboard/1")
    print(f"- Get predictions: {BASE_URL}/predict/1")
    print()


if __name__ == "__main__":
    main()
