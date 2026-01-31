-- Update existing hospitals to Indian names and locations

-- Hospital 1
UPDATE hospitals 
SET hospital_name = 'Apollo Hospitals',
    location = 'Mumbai, Maharashtra'
WHERE id = 1;

-- Hospital 2
UPDATE hospitals 
SET hospital_name = 'Fortis Healthcare',
    location = 'Delhi, NCR'
WHERE id = 2;

-- Hospital 3
UPDATE hospitals 
SET hospital_name = 'Max Super Speciality Hospital',
    location = 'Bangalore, Karnataka'
WHERE id = 3;

-- Hospital 4 (if exists)
UPDATE hospitals 
SET hospital_name = 'AIIMS Hospital',
    location = 'Hyderabad, Telangana'
WHERE id = 4;

-- Verify changes
SELECT id, hospital_name, location FROM hospitals ORDER BY id;
