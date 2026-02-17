/**
 * Dashboard Overview Page - Redesigned
 * 
 * Main hospital operations dashboard displaying:
 * - Hospital selector
 * - Key metrics (beds, occupancy, utilization)
 * - Historical and predicted occupancy charts
 * - Alerts for high occupancy
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Bed, 
  Activity, 
  Heart, 
  TrendingUp,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import MetricCard from '../components/MetricCard';
import OccupancyChart from '../components/OccupancyChart';
import AlertsPanel from '../components/AlertsPanel';
import HospitalSelector from '../components/HospitalSelector';
import { getHospitals, getDashboard } from '../services/api';

const Dashboard = () => {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const previousAlerts = useRef([]);

  // Add error boundary for catching React errors
  const [hasError, setHasError] = useState(false);

  // Load hospitals on mount
  useEffect(() => {
    loadHospitals();
  }, []);

  // Auto-select first hospital after loading
  useEffect(() => {
    if (hospitals.length > 0 && !selectedHospitalId) {
      setSelectedHospitalId(hospitals[0].id);
    }
  }, [hospitals]);

  // Load dashboard data when hospital changes
  useEffect(() => {
    if (selectedHospitalId) {
      loadDashboard(selectedHospitalId);
    }
  }, [selectedHospitalId]);

  // Monitor alerts for changes and show notifications
  useEffect(() => {
    if (dashboardData?.alerts && previousAlerts.current.length > 0) {
      const newAlerts = dashboardData.alerts.filter(
        alert => !previousAlerts.current.some(
          prev => prev.date === alert.date && prev.severity === alert.severity
        )
      );

      newAlerts.forEach(alert => {
        const icon = alert.severity === 'red' ? '🚨' : alert.severity === 'yellow' ? '⚠️' : 'ℹ️';
        const toastStyle = {
          style: {
            background: alert.severity === 'red' ? '#fee2e2' : alert.severity === 'yellow' ? '#fef3c7' : '#dbeafe',
            color: alert.severity === 'red' ? '#991b1b' : alert.severity === 'yellow' ? '#92400e' : '#1e40af',
            border: `2px solid ${alert.severity === 'red' ? '#fecaca' : alert.severity === 'yellow' ? '#fde68a' : '#bfdbfe'}`,
            borderRadius: '12px',
            padding: '16px',
            fontWeight: '600',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          },
          duration: 5000,
          position: 'top-right',
        };

        toast(`${icon} New Alert: ${alert.message}`, toastStyle);
      });
    }

    if (dashboardData?.alerts) {
      previousAlerts.current = dashboardData.alerts;
    }
  }, [dashboardData]);

  const loadHospitals = async () => {
    try {
      setLoading(true);
      const data = await getHospitals();
      console.log('Dashboard: Hospitals loaded:', data);
      setHospitals(data);
      toast.success(`Loaded ${data.length} hospitals`);
    } catch (error) {
      console.error('Dashboard: Error fetching hospitals:', error);
      toast.error('Failed to load hospitals');
      // Set demo data to prevent crashes
      setHospitals([
        { id: 1, hospital_name: 'Test Hospital - Main', location: 'Test City', total_beds: 100, icu_beds: 20 },
        { id: 2, hospital_name: 'Test Hospital - Branch', location: 'Test City', total_beds: 250, icu_beds: 50 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async (hospitalId) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading dashboard for hospital:', hospitalId);
      const data = await getDashboard(hospitalId);
      console.log('Dashboard data received:', data);
      
      // If no predictions from backend, add demo predictions
      if (!data.predictions || data.predictions.length === 0) {
        console.log('No predictions from backend, adding demo predictions');
        data.predictions = [
          { date: '2026-02-18', predicted_occupancy: hospitalId === 1 ? 82 : 195, lower_bound: hospitalId === 1 ? 78 : 185, upper_bound: hospitalId === 1 ? 86 : 205 },
          { date: '2026-02-19', predicted_occupancy: hospitalId === 1 ? 85 : 210, lower_bound: hospitalId === 1 ? 80 : 195, upper_bound: hospitalId === 1 ? 90 : 225 },
          { date: '2026-02-20', predicted_occupancy: hospitalId === 1 ? 88 : 225, lower_bound: hospitalId === 1 ? 83 : 210, upper_bound: hospitalId === 1 ? 93 : 240 },
          { date: '2026-02-21', predicted_occupancy: hospitalId === 1 ? 86 : 220, lower_bound: hospitalId === 1 ? 81 : 200, upper_bound: hospitalId === 1 ? 91 : 240 },
          { date: '2026-02-22', predicted_occupancy: hospitalId === 1 ? 83 : 205, lower_bound: hospitalId === 1 ? 78 : 190, upper_bound: hospitalId === 1 ? 88 : 220 },
          { date: '2026-02-23', predicted_occupancy: hospitalId === 1 ? 80 : 190, lower_bound: hospitalId === 1 ? 75 : 175, upper_bound: hospitalId === 1 ? 85 : 205 },
          { date: '2026-02-24', predicted_occupancy: hospitalId === 1 ? 78 : 185, lower_bound: hospitalId === 1 ? 73 : 170, upper_bound: hospitalId === 1 ? 83 : 200 }
        ];
        toast.info('Using demo predictions (insufficient historical data)');
      }
      
      setDashboardData(data);
    } catch (err) {
      console.error('Dashboard error:', err);
      console.error('Error response:', err.response);
      toast.error('Failed to load dashboard data');
      setError('Failed to load dashboard: ' + (err.response?.data?.detail || err.message));
      // Set demo data if API fails
      const demoData = {
        hospital_id: hospitalId,
        hospital_name: hospitalId === 1 ? 'Test Hospital - Main' : 'Test Hospital - Branch',
        location: 'Test City',
        total_beds: hospitalId === 1 ? 100 : 250,
        icu_beds: hospitalId === 1 ? 20 : 5,
        current_occupied: hospitalId === 1 ? 75 : 187,
        current_icu_occupied: hospitalId === 1 ? 12 : 18,
        current_utilization: hospitalId === 1 ? 75.0 : 74.8,
        historical_data: [],
        predictions: [
          { date: '2026-02-18', predicted_occupancy: hospitalId === 1 ? 82 : 195, lower_bound: hospitalId === 1 ? 78 : 185, upper_bound: hospitalId === 1 ? 86 : 205 },
          { date: '2026-02-19', predicted_occupancy: hospitalId === 1 ? 85 : 210, lower_bound: hospitalId === 1 ? 80 : 195, upper_bound: hospitalId === 1 ? 90 : 225 },
          { date: '2026-02-20', predicted_occupancy: hospitalId === 1 ? 88 : 225, lower_bound: hospitalId === 1 ? 83 : 210, upper_bound: hospitalId === 1 ? 93 : 240 },
          { date: '2026-02-21', predicted_occupancy: hospitalId === 1 ? 86 : 220, lower_bound: hospitalId === 1 ? 81 : 200, upper_bound: hospitalId === 1 ? 91 : 240 },
          { date: '2026-02-22', predicted_occupancy: hospitalId === 1 ? 83 : 205, lower_bound: hospitalId === 1 ? 78 : 190, upper_bound: hospitalId === 1 ? 88 : 220 },
          { date: '2026-02-23', predicted_occupancy: hospitalId === 1 ? 80 : 190, lower_bound: hospitalId === 1 ? 75 : 175, upper_bound: hospitalId === 1 ? 85 : 205 },
          { date: '2026-02-24', predicted_occupancy: hospitalId === 1 ? 78 : 185, lower_bound: hospitalId === 1 ? 73 : 170, upper_bound: hospitalId === 1 ? 83 : 200 }
        ],
        alerts: [],
        overall_status: 'green'
      };
      console.log('Setting demo data with predictions:', demoData.predictions);
      setDashboardData(demoData);
      toast.success('Showing demo data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (selectedHospitalId) {
      loadDashboard(selectedHospitalId);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      green: 'bg-green-100 text-green-800 border border-green-300',
      yellow: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
      red: 'bg-red-100 text-red-800 border border-red-300',
    };
    const labels = {
      green: 'Normal',
      yellow: 'Caution',
      red: 'Critical',
    };
    const icons = {
      green: <CheckCircle className="w-4 h-4" />,
      yellow: <AlertCircle className="w-4 h-4" />,
      red: <AlertCircle className="w-4 h-4" />
    };
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${styles[status]}`}>
        {icons[status]}
        {labels[status]}
      </span>
    );
  };

  const predictionValues = (dashboardData?.predictions || [])
    .map((prediction) => Number(prediction?.predicted_occupancy))
    .filter((value) => Number.isFinite(value));
  const peakForecast = predictionValues.length > 0
    ? Math.round(Math.max(...predictionValues))
    : null;

  if (hasError) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-red-900 mb-2">Something went wrong</h2>
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loading Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Please wait while we load your hospital data...
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2 text-center">Error Loading Dashboard</h3>
          <p className="text-red-700 text-center mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="w-full px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Error Boundary */}
      {hasError && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Something went wrong</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !hasError && (
        <div className="flex items-center justify-center h-full">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Loading Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Please wait while we load your hospital data...
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      {!loading && !hasError && (
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Monitor bed occupancy and predict future demand</p>
        </div>
      )}

      {/* Hospital Selector */}
      {!loading && !hasError && (
        <div className="mb-6">
          <HospitalSelector
            hospitals={hospitals}
            selectedId={selectedHospitalId}
            onChange={setSelectedHospitalId}
          />
        </div>
      )}

      {/* Dashboard Content */}
      {!loading && !hasError && selectedHospitalId && dashboardData && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {dashboardData.hospital_name}
              </h1>
              <p className="text-gray-600">
                {dashboardData.location}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4 text-sky-500" />
                Refresh
              </button>
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Beds"
            value={dashboardData.total_beds || 0}
            icon={Bed}
            color="blue"
            trend={null}
          />
          <MetricCard
            title="Current Occupancy"
            value={dashboardData.current_occupied || 0}
            icon={Activity}
            color="purple"
            trend={null}
          />
          <MetricCard
            title="ICU Beds Used"
            value={dashboardData.current_icu_occupied || 0}
            icon={Heart}
            color="red"
            trend={null}
          />
          <MetricCard
            title="Utilization Rate"
            value={`${dashboardData.current_utilization || 0}%`}
            icon={TrendingUp}
            color={dashboardData.overall_status === 'green' ? 'green' : dashboardData.overall_status === 'yellow' ? 'yellow' : 'red'}
            trend={null}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Occupancy Forecast</h2>
                <p className="text-sm text-gray-600">Historical data and 7-day predictions</p>
              </div>
              <OccupancyChart
                historicalData={dashboardData.historical_data}
                predictions={dashboardData.predictions}
              />
            </div>
            {dashboardData && (
              <div className="flex items-center gap-4">
                {getStatusBadge(dashboardData.overall_status || 'green')}
                <div className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            )}
            <div className="text-sm text-gray-600">
              {dashboardData.total_beds ? Math.round((((dashboardData.total_beds || 0) - (dashboardData.current_occupied || 0)) / dashboardData.total_beds) * 100) : 0}% capacity available
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
                <div>
                <div className="text-sm font-semibold text-gray-600">Peak Forecast</div>
                <div className="text-2xl font-bold text-gray-900">
                  {peakForecast ?? 'N/A'}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Expected within 7 days
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-600">Status</div>
                <div className="text-2xl font-bold text-gray-900 capitalize">
                  {dashboardData.overall_status || 'normal'}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              System operating normally
            </div>
          </div>
        </div>
      </>
      )}
    </div>
  );
};

export default Dashboard;
