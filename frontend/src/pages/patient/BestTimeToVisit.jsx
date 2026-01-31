/**
 * Best Time to Visit Page
 * 
 * Shows 7-day forecast with best day recommendation
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  Calendar, 
  TrendingDown, 
  TrendingUp, 
  Activity,
  Star,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Bed
} from 'lucide-react';
import { getPublicHospitals, getPublicForecast } from '../../services/api';

const BestTimeToVisit = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    const hospitalId = searchParams.get('hospital');
    if (hospitalId && hospitals.length > 0) {
      const hospital = hospitals.find(h => h.id === parseInt(hospitalId));
      if (hospital) {
        setSelectedHospital(hospital);
        fetchForecast(hospital.id);
      }
    }
  }, [searchParams, hospitals]);

  const fetchHospitals = async () => {
    try {
      const data = await getPublicHospitals();
      console.log('Hospitals loaded:', data);
      setHospitals(data);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Failed to load hospitals');
      setError('Failed to load hospitals');
    }
  };

  const fetchForecast = async (hospitalId) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching forecast for hospital:', hospitalId);
      const data = await getPublicForecast(hospitalId);
      console.log('Forecast data received:', data);
      setForecast(data);
      toast.success(`Loaded 7-day forecast for ${data.hospital_name}`);
    } catch (error) {
      console.error('Error fetching forecast:', error);
      toast.error('Failed to load forecast data');
      setError('Failed to load forecast data');
    } finally {
      setLoading(false);
    }
  };

  const handleHospitalChange = (e) => {
    const hospitalId = e.target.value;
    if (hospitalId) {
      setSearchParams({ hospital: hospitalId });
      const hospital = hospitals.find(h => h.id === parseInt(hospitalId));
      setSelectedHospital(hospital);
      fetchForecast(parseInt(hospitalId));
    } else {
      setSelectedHospital(null);
      setForecast(null);
      setSearchParams({});
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (risk) => {
    switch (risk) {
      case 'low': return <TrendingDown className="w-4 h-4" />;
      case 'medium': return <Activity className="w-4 h-4" />;
      case 'high': return <TrendingUp className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Best Time to Visit</h1>
        <p className="text-gray-600 mt-2">
          View 7-day occupancy forecast and find the best day to visit
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
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mb-4"></div>
          <p className="text-gray-600">Loading forecast data...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <div className="text-red-600 text-2xl">⚠</div>
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-1">Error Loading Forecast</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => selectedHospital && fetchForecast(selectedHospital.id)}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forecast Results */}
      {!loading && !error && forecast && selectedHospital && (
        <div className="space-y-6">
          {/* Hospital Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">{forecast.hospital_name}</h2>
                <p className="text-gray-600">{forecast.location}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Beds</div>
                <div className="text-2xl font-bold text-gray-900">{forecast.total_beds}</div>
              </div>
            </div>
          </div>

          {/* Best Day Highlight */}
          {forecast.best_day_to_visit && (
            <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl shadow-sm border-2 border-sky-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-sky-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Best Day to Visit
                  </h2>
                  <p className="text-3xl font-bold text-sky-600 mb-2">
                    {formatDate(forecast.best_day_to_visit)}
                  </p>
                  <p className="text-gray-700">
                    Expected occupancy: <span className="font-semibold">{forecast.best_day_occupancy} beds occupied</span>
                    {' '}• Available beds: <span className="font-semibold">{forecast.total_beds - forecast.best_day_occupancy}</span>
                  </p>
                  {(() => {
                    const utilization = (forecast.best_day_occupancy / forecast.total_beds) * 100;
                    const risk = utilization >= 80 ? 'high' : utilization >= 60 ? 'medium' : 'low';
                    return (
                      <div className="mt-3">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${getRiskColor(risk)}`}>
                          {getRiskIcon(risk)}
                          <span className="capitalize">{risk} Risk • {utilization.toFixed(1)}% occupancy</span>
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Recommendation Box */}
          {(() => {
            const highRiskDays = forecast.forecast.filter(day => day.utilization_percentage >= 85);
            if (highRiskDays.length > 0) {
              return (
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-sm border-2 border-yellow-200 p-6">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">⚠️</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">High Occupancy Warning</h3>
                      <p className="text-gray-700 mb-3">
                        This hospital expects <span className="font-semibold text-orange-700">{highRiskDays.length} day{highRiskDays.length > 1 ? 's' : ''}</span> with high occupancy (≥85%). 
                        Long wait times are likely.
                      </p>
                      <div className="bg-white rounded-lg p-3 border border-yellow-300">
                        <p className="text-sm font-semibold text-gray-900 mb-1">💡 Recommendations:</p>
                        <ul className="text-sm text-gray-700 space-y-1 ml-4 list-disc">
                          <li>Visit on <span className="font-semibold text-green-700">{formatDate(forecast.best_day_to_visit)}</span> for best availability</li>
                          <li>Call ahead to confirm bed availability</li>
                          <li>Consider nearby hospitals with better availability</li>
                          <li>Check the <a href="/patient/alerts?hospital={forecast.hospital_id}" className="text-sky-600 hover:underline font-medium">Alerts page</a> for alternative hospitals</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* 7-Day Forecast */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">7-Day Forecast</h3>
              <div className="text-sm text-gray-500">Updated in real-time</div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {forecast.forecast.map((day, index) => {
                const isBestDay = day.date === forecast.best_day_to_visit;
                const isHighRisk = day.utilization_percentage >= 85;
                const isMediumRisk = day.utilization_percentage >= 70 && day.utilization_percentage < 85;
                
                return (
                  <div
                    key={index}
                    className={`relative p-5 rounded-xl border-2 transition-all duration-300 hover:shadow-lg ${
                      isBestDay
                        ? 'bg-gradient-to-br from-sky-50 to-blue-50 border-sky-400 shadow-md'
                        : isHighRisk
                        ? 'bg-gradient-to-br from-red-50 to-pink-50 border-red-300'
                        : isMediumRisk
                        ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300'
                        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                    }`}
                  >
                    {/* Best Day Badge */}
                    {isBestDay && (
                      <div className="absolute -top-3 -right-3 bg-sky-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                        <Star className="w-3 h-3 fill-white" />
                        Best Day
                      </div>
                    )}

                    {/* Date Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="text-lg font-bold text-gray-900 mb-1">
                          {formatDate(day.date)}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Bed className="w-3 h-3" />
                          <span>{day.predicted_available} beds available</span>
                        </div>
                      </div>
                      
                      {/* Risk Badge */}
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border shadow-sm ${getRiskColor(day.risk_level)}`}>
                        {getRiskIcon(day.risk_level)}
                        <span className="uppercase">{day.risk_level}</span>
                      </div>
                    </div>

                    {/* Occupancy Visualization */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 font-medium">Occupancy Rate</span>
                        <span className="text-2xl font-bold text-gray-900">
                          {day.utilization_percentage.toFixed(1)}%
                        </span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                        <div
                          className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ${
                            day.utilization_percentage >= 85
                              ? 'bg-gradient-to-r from-red-500 to-red-600'
                              : day.utilization_percentage >= 70
                              ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                              : 'bg-gradient-to-r from-green-500 to-emerald-500'
                          }`}
                          style={{ width: `${Math.min(day.utilization_percentage, 100)}%` }}
                        />
                      </div>

                      {/* Occupancy Details */}
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200">
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Occupied</div>
                          <div className="text-sm font-bold text-gray-900">{day.predicted_occupied}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-500 mb-1">Available</div>
                          <div className="text-sm font-bold text-green-600">{day.predicted_available}</div>
                        </div>
                      </div>
                    </div>

                    {/* Warning Message */}
                    {isHighRisk && (
                      <div className="mt-3 pt-3 border-t border-red-200">
                        <p className="text-xs text-red-700 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          High occupancy - Long wait times expected
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Risk Levels</h4>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-gray-600"><span className="font-medium">Low:</span> &lt;60% occupancy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span className="text-gray-600"><span className="font-medium">Medium:</span> 60-80% occupancy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-gray-600"><span className="font-medium">High:</span> &gt;80% occupancy</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && !forecast && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Forecast Selected</h3>
          <p className="text-gray-600">Select a hospital above to view the 7-day forecast</p>
        </div>
      )}
    </div>
  );
};

export default BestTimeToVisit;
