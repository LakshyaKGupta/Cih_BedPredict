/**
 * Main App Component
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, USER_ROLES } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import PatientDashboardLayout from './components/PatientDashboardLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Hospitals from './pages/Hospitals';
import EHRData from './pages/EHRData';
import Predictions from './pages/Predictions';
import Analytics from './pages/Analytics';
import Alerts from './pages/Alerts';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import PatientDashboard from './pages/patient/PatientDashboard';
import BestTimeToVisit from './pages/patient/BestTimeToVisit';
import CompareHospitals from './pages/patient/CompareHospitals';
import PatientAlerts from './pages/patient/PatientAlerts';
import './index.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#363636',
              color: '#fff',
              fontSize: '14px',
              borderRadius: '8px',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Hospital Admin Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireRole={USER_ROLES.HOSPITAL_ADMIN}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="hospitals" element={<Hospitals />} />
            <Route path="ehr-data" element={<EHRData />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Patient Routes */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute requireRole={USER_ROLES.PATIENT}>
                <PatientDashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<PatientDashboard />} />
            <Route path="forecast" element={<BestTimeToVisit />} />
            <Route path="compare" element={<CompareHospitals />} />
            <Route path="alerts" element={<PatientAlerts />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
