/**
 * Predictions Page
 * 
 * Detailed view of bed occupancy predictions
 * Prophet ML forecasts with confidence intervals
 */

import { useState, useEffect } from 'react';
import { TrendingUp, AlertCircle, Calendar, BarChart3, RefreshCw } from 'lucide-react';
import { getHospitals, getPredictions } from '../services/api';

const Predictions = () => {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forecastDays, setForecastDays] = useState(7);

  useEffect(() => {
    loadHospitals();
  }, []);

  useEffect(() => {
    if (selectedHospitalId) {
      loadPredictions(selectedHospitalId);
    }
  }, [selectedHospitalId, forecastDays]);

  const loadHospitals = async () => {
    try {
      const data = await getHospitals();
      setHospitals(data);
      if (data.length > 0) {
        setSelectedHospitalId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to load hospitals:', error);
    }
  };

  const loadPredictions = async (hospitalId) => {
    setLoading(true);
    try {
      const data = await getPredictions(hospitalId, forecastDays);
      setPredictions(data);
    } catch (error) {
      console.error('Failed to load predictions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (occupancy, totalBeds) => {
    const percentage = (occupancy / totalBeds) * 100;
    if (percentage > 85) return 'text-red-600 bg-red-50 border-red-200';
    if (percentage > 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const predictionValues = (predictions?.predictions || [])
    .map((prediction) => Number(prediction?.predicted_occupancy))
    .filter((value) => Number.isFinite(value));
  const peakForecast = predictionValues.length > 0 ? Math.max(...predictionValues) : null;
  const averageForecast = predictionValues.length > 0
    ? Math.round(predictionValues.reduce((sum, value) => sum + value, 0) / predictionValues.length)
    : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Predictions</h1>
          <p className="text-gray-600">7-day bed occupancy forecasts powered by Prophet ML</p>
        </div>
        <button
          onClick={() => selectedHospitalId && loadPredictions(selectedHospitalId)}
          disabled={loading}
          className="px-6 py-3 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Hospital</label>
            <select
              value={selectedHospitalId || ''}
              onChange={(e) => setSelectedHospitalId(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            >
              {hospitals.map((hospital) => (
                <option key={hospital.id} value={hospital.id}>
                  {hospital.hospital_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Forecast Period</label>
            <select
              value={forecastDays}
              onChange={(e) => setForecastDays(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
            >
              <option value="3">3 Days</option>
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
        </div>
      ) : predictions ? (
        <>
          {/* Key Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl p-6 border border-sky-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-600">Peak Forecast</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {peakForecast !== null ? Math.round(peakForecast) : 'N/A'}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">Expected maximum occupancy</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-600">Avg Forecast</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {averageForecast ?? 'N/A'}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">Average predicted occupancy</p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-600">Risk Days</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {predictions?.total_beds ? (predictions.predictions || []).filter(p => (p.predicted_occupancy / predictions.total_beds) > 0.85).length : 0}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">Days above 85% capacity</p>
            </div>
          </div>

          {/* Forecast Timeline */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Forecast Timeline</h2>
            <div className="space-y-4">
              {(predictions.predictions || []).map((pred, idx) => {
                const percentage = predictions?.total_beds ? (pred.predicted_occupancy / predictions.total_beds) * 100 : 0;
                return (
                  <div key={idx} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <div className="font-bold text-gray-900">
                            {new Date(pred.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-sm text-gray-500">Day {idx + 1}</div>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-xl border ${getStatusColor(pred.predicted_occupancy, predictions?.total_beds || 250)}`}>
                        <span className="text-sm font-bold">{Math.round(pred.predicted_occupancy)} / {predictions?.total_beds || 250}</span>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="relative">
                      <div className="w-full h-8 bg-gray-100 rounded-lg overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            percentage > 85 ? 'bg-gradient-to-r from-red-500 to-red-600' :
                            percentage > 70 ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                            'bg-gradient-to-r from-green-500 to-green-600'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold text-gray-900">{percentage.toFixed(1)}% Capacity</span>
                      </div>
                    </div>

                    {/* Confidence Interval */}
                    {pred.lower_bound && pred.upper_bound && (
                      <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-semibold">Lower:</span> {Math.round(pred.lower_bound)}
                        </div>
                        <div>
                          <span className="font-semibold">Upper:</span> {Math.round(pred.upper_bound)}
                        </div>
                        <div className="ml-auto">
                          <span className="font-semibold">Confidence:</span> 95%
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Model Info */}
          <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl p-6 border border-sky-100">
            <h3 className="text-lg font-bold text-gray-900 mb-3">About This Forecast</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-semibold">Model:</span> Prophet ML (Facebook's time-series forecasting algorithm)
              </p>
              <p>
                <span className="font-semibold">Training Data:</span> Historical EHR records from the past 60+ days
              </p>
              <p>
                <span className="font-semibold">Accuracy:</span> 95% confidence intervals shown for each prediction
              </p>
              <p>
                <span className="font-semibold">Updates:</span> Forecasts are regenerated daily with new EHR data
              </p>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Predictions Available</h3>
          <p className="text-gray-600">Select a hospital to view forecasts</p>
        </div>
      )}
    </div>
  );
};

export default Predictions;
