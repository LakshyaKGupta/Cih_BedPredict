/**
 * HospitalSelector Component
 * 
 * Dropdown for selecting hospitals
 */

import React from 'react';
import { Building2 } from 'lucide-react';

const HospitalSelector = ({ hospitals, selectedId, onChange }) => {
  const handleChange = (e) => {
    try {
      const value = e.target.value;
      const numValue = value === '' ? null : Number(value);
      console.log('HospitalSelector: Changing to:', numValue, 'from:', selectedId);
      onChange(numValue);
    } catch (error) {
      console.error('Error in hospital selector:', error);
    }
  };

  console.log('HospitalSelector: Hospitals:', hospitals);
  console.log('HospitalSelector: Selected ID:', selectedId);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-3">
      <Building2 className="h-6 w-6 text-blue-600" />
      <div className="flex-1">
        <label htmlFor="hospital-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Hospital
        </label>
        <select
          id="hospital-select"
          value={selectedId || ''}
          onChange={handleChange}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {hospitals.map((hospital) => (
            <option key={hospital.id} value={hospital.id}>
              {hospital.hospital_name} - {hospital.location}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default HospitalSelector;
