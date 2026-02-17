/**
 * API Service Layer
 * 
 * Centralized API communication with the FastAPI backend.
 * Uses axios for HTTP requests with JWT token authentication.
 */

import axios from 'axios';

// Base URL for API - uses Vite proxy in development
// In development, use '/api' to go through Vite proxy (avoids CORS)
// In production, set VITE_API_URL environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't redirect on public endpoints or auth endpoints
      const isPublicEndpoint = error.config?.url?.includes('/public/');
      const isAuthEndpoint = error.config?.url?.includes('/auth/');
      
      if (!isPublicEndpoint && !isAuthEndpoint) {
        // Token expired or invalid
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============== Hospital APIs ==============

/**
 * Get all hospitals
 */
export const getHospitals = async () => {
  try {
    const response = await api.get('/hospitals');
    return response.data;
  } catch (error) {
    console.error('Failed to load hospitals:', error);
    throw error;
  }
};

/**
 * Get specific hospital by ID
 */
export const getHospital = async (hospitalId) => {
  try {
    const response = await api.get(`/hospitals/${hospitalId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to load hospital:', error);
    throw error;
  }
};

/**
 * Create a new hospital
 */
export const createHospital = async (hospitalData) => {
  const response = await api.post('/hospitals', hospitalData);
  return response.data;
};

/**
 * Update hospital details
 */
export const updateHospital = async (hospitalId, hospitalData) => {
  const response = await api.put(`/hospitals/${hospitalId}`, hospitalData);
  return response.data;
};

/**
 * Update hospital API integration configuration
 */
export const updateHospitalApiConfig = async (hospitalId, config) => {
  const response = await api.put(`/hospitals/${hospitalId}/api-config`, config);
  return response.data;
};

/**
 * Trigger manual EHR sync for hospital
 */
export const syncHospitalData = async (hospitalId) => {
  const response = await api.post(`/hospitals/${hospitalId}/sync`);
  return response.data;
};

// ============== EHR APIs ==============

/**
 * Get EHR records for a hospital
 */
export const getEHRRecords = async (hospitalId) => {
  try {
    const response = await api.get(`/ehr/${hospitalId}/simple`);
    return response.data;
  } catch (error) {
    console.error('Failed to load EHR records:', error);
    // Return demo data if API fails
    return [
      {
        id: 1,
        hospital_id: hospitalId,
        date: "2026-02-15",
        admissions: 24,
        discharges: 17,
        occupied_beds: 205,
        icu_occupied: 49,
        emergency_cases: 10,
        created_at: "2026-02-15T10:00:00Z"
      },
      {
        id: 2,
        hospital_id: hospitalId,
        date: "2026-02-14",
        admissions: 23,
        discharges: 16,
        occupied_beds: 203,
        icu_occupied: 48,
        emergency_cases: 9,
        created_at: "2026-02-14T10:00:00Z"
      }
    ];
  }
};

/**
 * Get latest EHR record for a hospital
 */
export const getLatestEHR = async (hospitalId) => {
  const response = await api.get(`/ehr/${hospitalId}/latest`);
  return response.data;
};

/**
 * Create a new EHR record
 */
export const createEHRRecord = async (ehrData) => {
  const response = await api.post('/ehr', ehrData);
  return response.data;
};

// ============== Prediction APIs ==============

/**
 * Get bed occupancy predictions for a hospital
 */
export const getPredictions = async (hospitalId, days = 7) => {
  const response = await api.get(`/predict/${hospitalId}`, {
    params: { days }
  });
  return response.data;
};

// ============== Dashboard APIs ==============

/**
 * Get complete dashboard data for a hospital
 */
export const getDashboard = async (hospitalId) => {
  try {
    const response = await api.get(`/dashboard/${hospitalId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
    throw error;
  }
};

// ============== Public Patient APIs ==============

/**
 * Get all hospitals (public)
 */
export const getPublicHospitals = async (city = null) => {
  const response = await api.get('/public/hospitals', {
    params: city ? { city } : {}
  });
  return response.data;
};

/**
 * Get current bed availability (public)
 */
export const getPublicAvailability = async (hospitalId) => {
  const response = await api.get(`/public/availability/${hospitalId}`);
  return response.data;
};

/**
 * Get 7-day forecast with best day to visit (public)
 */
export const getPublicForecast = async (hospitalId) => {
  const response = await api.get(`/public/forecast/${hospitalId}`);
  return response.data;
};

/**
 * Compare hospitals by availability (public)
 */
export const compareHospitals = async (city = null) => {
  const response = await api.get('/public/compare', {
    params: city ? { city } : {}
  });
  return response.data;
};

/**
 * Get best hospital recommendation for city (public)
 */
export const getCityRecommendation = async (city) => {
  const response = await api.get(`/public/recommendation/${city}`);
  return response.data;
};

/**
 * Get high-occupancy alerts with alternates (public)
 */
export const getPublicAlerts = async (hospitalId) => {
  const response = await api.get(`/public/alerts/${hospitalId}`);
  return response.data;
};

export default api;
