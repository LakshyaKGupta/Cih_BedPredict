/**
 * Register Page
 * 
 * User registration page with role selection (Hospital Admin or Patient)
 * Modern card-based design with validation
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth, USER_ROLES } from '../context/AuthContext';
import { Heart, AlertCircle, Building2, User } from 'lucide-react';
import { getPublicHospitals } from '../services/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: USER_ROLES.PATIENT,
    hospitalId: ''
  });
  const [hospitals, setHospitals] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  // Fetch hospitals for admin registration
  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        console.log('Fetching hospitals from public API...');
        const data = await getPublicHospitals();
        console.log('Hospitals fetched:', data);
        setHospitals(data);
      } catch (err) {
        console.error('Error fetching hospitals:', err);
        console.error('Error details:', err.response?.data);
      }
    };
    fetchHospitals();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Clear hospitalId when switching to patient
      ...(name === 'role' && value === USER_ROLES.PATIENT && { hospitalId: '' })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.password) {
      setError('Please fill in all required fields');
      toast.error('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (formData.role === USER_ROLES.HOSPITAL_ADMIN && !formData.hospitalId) {
      setError('Hospital admins must select a hospital');
      toast.error('Hospital admins must select a hospital');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      toast.error('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      toast.error('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const toastId = toast.loading('Creating account...');
    const result = await register(
      formData.name,
      formData.email,
      formData.password,
      formData.role,
      formData.hospitalId ? parseInt(formData.hospitalId) : null
    );
    
    if (!result.success) {
      toast.error(result.error || 'Registration failed', { id: toastId });
      setError(result.error || 'Registration failed. Please try again.');
    } else {
      toast.success('Account created successfully!', { id: toastId });
    }
    // Navigation handled in AuthContext based on role
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-sky-600 rounded-2xl shadow-lg mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-600">Join us to start predicting bed occupancy</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                I am a... <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleChange({ target: { name: 'role', value: USER_ROLES.PATIENT } })}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    formData.role === USER_ROLES.PATIENT
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <User className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-semibold">Patient</div>
                  <div className="text-xs text-gray-500 mt-1">Find best time to visit</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleChange({ target: { name: 'role', value: USER_ROLES.HOSPITAL_ADMIN } })}
                  className={`p-4 border-2 rounded-xl transition-all ${
                    formData.role === USER_ROLES.HOSPITAL_ADMIN
                      ? 'border-sky-500 bg-sky-50 text-sky-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Building2 className="w-6 h-6 mx-auto mb-2" />
                  <div className="text-sm font-semibold">Hospital Admin</div>
                  <div className="text-xs text-gray-500 mt-1">Manage hospital data</div>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none"
                placeholder="John Doe"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none"
                placeholder={formData.role === USER_ROLES.HOSPITAL_ADMIN ? "admin@hospital.com" : "patient@email.com"}
                disabled={loading}
              />
            </div>

            {/* Hospital Selection (only for admins) */}
            {formData.role === USER_ROLES.HOSPITAL_ADMIN && (
              <div>
                <label htmlFor="hospitalId" className="block text-sm font-semibold text-gray-700 mb-2">
                  Select Hospital <span className="text-red-500">*</span>
                </label>
                <select
                  id="hospitalId"
                  name="hospitalId"
                  value={formData.hospitalId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none"
                  disabled={loading}
                >
                  <option value="">Choose a hospital...</option>
                  {hospitals.map(hospital => (
                    <option key={hospital.id} value={hospital.id}>
                      {hospital.hospital_name} - {hospital.location}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all outline-none"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-sky-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-sky-600 font-semibold hover:text-sky-700 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
