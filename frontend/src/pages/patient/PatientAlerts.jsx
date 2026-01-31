/**
 * Patient Alerts Page
 * 
 * View high-occupancy alerts with alternate hospital suggestions
 */

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, MapPin, Bed, ArrowRight, Info } from 'lucide-react';
import { getPublicHospitals, getPublicAlerts } from '../../services/api';

const PatientAlerts = () => {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [alerts, setAlerts] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const data = await getPublicHospitals();
      setHospitals(data);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Failed to load hospitals');
    }
  };

  const fetchAlerts = async (hospitalId) => {
    try {
      setLoading(true);
      const data = await getPublicAlerts(hospitalId);
      setAlerts(data);
      if (data.alerts && data.alerts.length > 0) {
        toast.success(`Found ${data.alerts.length} alert${data.alerts.length > 1 ? 's' : ''}`);
      } else {
        toast.success('No alerts - Hospital has good availability!');
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to fetch alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleHospitalChange = (e) => {
    const hospitalId = e.target.value;
    if (hospitalId) {
      const hospital = hospitals.find(h => h.id === parseInt(hospitalId));
      setSelectedHospital(hospital);
      fetchAlerts(hospitalId);
    } else {
      setSelectedHospital(null);
      setAlerts(null);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Hospital Alerts</h1>
        <p className="text-gray-600 mt-2">
          Check for high-occupancy warnings and find alternative hospitals
        </p>
      </div>

      {/* Hospital Selection */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Select Hospital
        </label>
        <select
          value={selectedHospital?.id || ''}
          onChange={handleHospitalChange}
          className="w-full md:w-96 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        >
          <option value="">Choose a hospital...</option>
          {hospitals.map(hospital => (
            <option key={hospital.id} value={hospital.id}>
              {hospital.hospital_name} - {hospital.location}
            </option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
        </div>
      )}

      {/* Alerts Display */}
      {!loading && alerts && selectedHospital && (
        <div className="space-y-6">
          {/* Summary */}
          <div className={`rounded-xl shadow-sm border-2 p-6 ${
            alerts.alerts && alerts.alerts.length > 0
              ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300'
              : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
          }`}>
            <div className="flex items-start gap-4">
              {alerts.alerts && alerts.alerts.length > 0 ? (
                <>
                  <div className="w-14 h-14 bg-yellow-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <AlertTriangle className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {alerts.alerts.length} Alert{alerts.alerts.length !== 1 ? 's' : ''} Detected
                    </h2>
                    <p className="text-gray-700 text-lg mb-3">
                      {selectedHospital.hospital_name} is experiencing or will experience high occupancy.
                    </p>
                    {alerts.alternate_hospitals && alerts.alternate_hospitals.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-yellow-200 inline-block">
                        <p className="text-sm font-semibold text-yellow-800">
                          💡 {alerts.alternate_hospitals.length} alternative hospital{alerts.alternate_hospitals.length !== 1 ? 's' : ''} with better availability found below
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Info className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      All Clear ✓
                    </h2>
                    <p className="text-gray-700 text-lg">
                      {selectedHospital.hospital_name} has good availability. Safe to visit!
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Alert Cards */}
          {alerts.alerts && alerts.alerts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Detailed Alerts</h3>
                <span className="text-sm text-gray-500">Next 7 days</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {alerts.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-5 rounded-xl border-2 shadow-sm hover:shadow-md transition-all duration-300 ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl flex-shrink-0">{getSeverityIcon(alert.severity)}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                            alert.severity === 'critical' ? 'bg-red-200 text-red-800' :
                            alert.severity === 'warning' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>
                            {alert.severity}
                          </span>
                          <span className="text-xs text-gray-600 font-medium">
                            {new Date(alert.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-800 font-medium leading-relaxed">{alert.message}</p>
                        
                        {alert.severity === 'critical' && (
                          <div className="mt-3 pt-3 border-t border-red-200">
                            <p className="text-xs text-red-700 font-semibold">⚠️ Action recommended: Consider alternate hospitals</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alternate Hospitals */}
          {alerts && alerts.alternate_hospitals && alerts.alternate_hospitals.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border-2 border-blue-200 p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Recommended Alternatives
                  </h3>
                  <p className="text-sm text-gray-600">
                    {alerts.alternate_hospitals.length} hospital{alerts.alternate_hospitals.length !== 1 ? 's' : ''} with better availability
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {alerts.alternate_hospitals.map((hospital, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-5 border-2 border-green-300 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg mb-2">{hospital.hospital_name}</h4>
                        <p className="text-sm text-gray-600 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-green-600" />
                          {hospital.location}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">✓</span>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Bed className="w-4 h-4" />
                          <span>Total Beds</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">
                          {hospital.total_beds}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-700 font-bold">Good availability expected</span>
                      </div>
                    </div>

                    <button className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                      View Details
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">💡 Pro Tip:</span> Call ahead to confirm bed availability before visiting any hospital. Emergency wait times may vary.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !alerts && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Hospital Selected</h3>
          <p className="text-gray-600">Select a hospital above to view alerts</p>
        </div>
      )}
    </div>
  );
};

export default PatientAlerts;
