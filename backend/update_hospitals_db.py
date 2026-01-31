"""
Direct database update for hospitals to Indian names and locations
Run this script to update existing hospitals without losing EHR data
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.hospital import Hospital
from app.models.user import User  # Import User to resolve relationship

# Indian hospital data
INDIAN_HOSPITALS = {
    1: {
        "hospital_name": "Apollo Hospitals",
        "location": "Mumbai, Maharashtra"
    },
    2: {
        "hospital_name": "Fortis Healthcare",
        "location": "Delhi, NCR"
    },
    3: {
        "hospital_name": "Max Super Speciality Hospital",
        "location": "Bangalore, Karnataka"
    },
    4: {
        "hospital_name": "AIIMS Hospital",
        "location": "Hyderabad, Telangana"
    }
}

def update_hospitals():
    """Update hospital names and locations in database"""
    db = SessionLocal()
    
    try:
        hospitals = db.query(Hospital).all()
        print(f"Found {len(hospitals)} hospitals in database\n")
        
        for hospital in hospitals:
            if hospital.id in INDIAN_HOSPITALS:
                old_name = hospital.hospital_name
                old_location = hospital.location
                
                # Update hospital
                hospital.hospital_name = INDIAN_HOSPITALS[hospital.id]["hospital_name"]
                hospital.location = INDIAN_HOSPITALS[hospital.id]["location"]
                
                print(f"Hospital ID {hospital.id}:")
                print(f"  Old: {old_name} - {old_location}")
                print(f"  New: {hospital.hospital_name} - {hospital.location}")
                print()
        
        # Commit changes
        db.commit()
        print("✓ All hospitals updated successfully!")
        
        # Verify
        print("\nCurrent hospitals:")
        hospitals = db.query(Hospital).all()
        for h in hospitals:
            print(f"  {h.id}: {h.hospital_name} - {h.location}")
        
    except Exception as e:
        print(f"Error updating hospitals: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Updating hospitals to Indian names and locations...\n")
    update_hospitals()
