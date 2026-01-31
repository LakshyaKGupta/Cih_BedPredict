"""
Update existing hospitals to Indian names and locations
"""

import requests

BASE_URL = "http://localhost:8000/api"

# Login credentials (use hospital admin account)
# Note: You may need to adjust these credentials based on your setup
LOGIN_DATA = {
    "email": "admin@hospital.com",
    "password": "password123"
}

# New Indian hospital data
INDIAN_HOSPITALS = [
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

def update_hospitals():
    """Update existing hospitals with Indian names"""
    
    # Get all hospitals from public API
    try:
        response = requests.get(f"{BASE_URL}/public/hospitals")
        if response.status_code != 200:
            print(f"Failed to fetch hospitals: {response.text}")
            return
        
        existing_hospitals = response.json()
        print(f"Found {len(existing_hospitals)} existing hospitals\n")
        
        # Update each hospital
        for i, hospital in enumerate(existing_hospitals):
            if i < len(INDIAN_HOSPITALS):
                hospital_id = hospital['id']
                new_data = INDIAN_HOSPITALS[i]
                
                print(f"Hospital {hospital_id}:")
                print(f"  Old: {hospital['hospital_name']} - {hospital['location']}")
                print(f"  New: {new_data['hospital_name']} - {new_data['location']}")
                
                # Note: Update would require authentication
                # For now, just show what would be updated
                print(f"  ✓ Ready to update\n")
        
        print("\nTo apply these changes, you need to:")
        print("1. Delete the database and recreate it, OR")
        print("2. Manually update via SQL, OR")
        print("3. Re-run generate_data.py to create new hospitals")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_hospitals()
