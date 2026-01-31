/**
 * Hospitals Management Page
 * 
 * View and manage all hospitals in the system
 * Add new hospitals, view details, edit information
 */

import { useState, useEffect } from 'react';
import { Hospital, MapPin, Bed, Heart, Plus, Search, Edit2, Trash2, X, Eye, Activity, Wifi, WifiOff, Settings, Zap, Clock } from 'lucide-react';
import { getHospitals, getDashboard, createHospital } from '../services/api';
import toast from 'react-hot-toast';

const Hospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAPIModal, setShowAPIModal] = useState(false);
  const [hospitalDetails, setHospitalDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [formData, setFormData] = useState({
    hospital_name: '',
    location: '',
    total_beds: '',
    icu_beds: ''
  });
  const [apiConfig, setApiConfig] = useState({
    api_enabled: false,
    api_endpoint: '',
    api_key: '',
    webhook_url: '',
    sync_interval: 300,
    api_notes: ''
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadHospitals();
  }, []);

  const loadHospitals = async () => {
    setLoading(true);
    try {
      const data = await getHospitals();
      setHospitals(data);
    } catch (error) {
      console.error('Failed to load hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredHospitals = hospitals.filter(hospital =>
    hospital.hospital_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hospital.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = async (hospital) => {
    setSelectedHospital(hospital);
    setShowDetailsModal(true);
    setLoadingDetails(true);
    
    try {
      const details = await getDashboard(hospital.id);
      setHospitalDetails(details);
    } catch (error) {
      console.error('Failed to load hospital details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleEdit = (hospital) => {
    setSelectedHospital(hospital);
    setFormData({
      hospital_name: hospital.hospital_name,
      location: hospital.location,
      total_beds: hospital.total_beds.toString(),
      icu_beds: hospital.icu_beds.toString()
    });
    setShowEditModal(true);
  };

  const handleUpdateHospital = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.hospital_name.trim()) {
      setFormError('Hospital name is required');
      return;
    }
    if (!formData.location.trim()) {
      setFormError('Location is required');
      return;
    }
    if (!formData.total_beds || formData.total_beds <= 0) {
      setFormError('Total beds must be greater than 0');
      return;
    }
    if (!formData.icu_beds || formData.icu_beds < 0) {
      setFormError('ICU beds must be 0 or greater');
      return;
    }
    if (parseInt(formData.icu_beds) > parseInt(formData.total_beds)) {
      setFormError('ICU beds cannot exceed total beds');
      return;
    }

    setSaving(true);
    const updateToast = toast.loading(`Updating ${selectedHospital.hospital_name}...`);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Please login to update hospitals');
      }
      
      const hospitalData = {
        hospital_name: formData.hospital_name.trim(),
        location: formData.location.trim(),
        total_beds: parseInt(formData.total_beds),
        icu_beds: parseInt(formData.icu_beds)
      };

      const response = await fetch(`http://localhost:8000/api/hospitals/${selectedHospital.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(hospitalData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update hospital');
      }
      
      toast.success('✅ Hospital updated successfully!', { id: updateToast });
      
      // Regenerate predictions for updated hospital
      try {
        const predictionToast = toast.loading('Regenerating predictions...');
        const predResponse = await fetch(`http://localhost:8000/api/predict/${selectedHospital.id}?days=7`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (predResponse.ok) {
          toast.success('✅ Predictions updated!', { id: predictionToast });
        } else {
          toast.dismiss(predictionToast);
        }
      } catch (predError) {
        console.error('Failed to regenerate predictions:', predError);
      }
      
      setFormData({
        hospital_name: '',
        location: '',
        total_beds: '',
        icu_beds: ''
      });
      setShowEditModal(false);
      await loadHospitals();
    } catch (error) {
      console.error('Failed to update hospital:', error);
      toast.error(error.message || 'Failed to update hospital', { id: updateToast });
      setFormError(error.message || 'Failed to update hospital. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setFormData({
      hospital_name: '',
      location: '',
      total_beds: '',
      icu_beds: ''
    });
    setFormError('');
    setSelectedHospital(null);
  };

  const handleConfigureAPI = (hospital) => {
    setSelectedHospital(hospital);
    setApiConfig({
      api_enabled: hospital.api_enabled || false,
      api_endpoint: hospital.api_endpoint || '',
      api_key: '', // Don't populate for security
      webhook_url: hospital.webhook_url || '',
      sync_interval: hospital.sync_interval || 300,
      api_notes: hospital.api_notes || ''
    });
    setShowAPIModal(true);
  };

  const handleSyncNow = async (hospital) => {
    if (!hospital.api_enabled) {
      toast.error('API integration not enabled for this hospital');
      return;
    }

    setSyncing(true);
    const syncToast = toast.loading(`Syncing data for ${hospital.hospital_name}...`);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/hospitals/${hospital.id}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const result = await response.json();
      toast.success(`✅ ${result.message} (${result.records_synced} records)`, { id: syncToast });
      await loadHospitals();
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync data. Check API configuration.', { id: syncToast });
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveAPIConfig = async (e) => {
    e.preventDefault();
    setFormError('');

    if (apiConfig.api_enabled && !apiConfig.api_endpoint.trim()) {
      setFormError('API endpoint is required when API is enabled');
      return;
    }

    setSaving(true);
    const saveToast = toast.loading('Saving API configuration...');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/hospitals/${selectedHospital.id}/api-config`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(apiConfig)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to save configuration');
      }

      toast.success('✅ API configuration saved successfully!', { id: saveToast });
      setShowAPIModal(false);
      await loadHospitals();
    } catch (error) {
      console.error('Failed to save API config:', error);
      toast.error(error.message || 'Failed to save configuration', { id: saveToast });
      setFormError(error.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (hospital) => {
    if (window.confirm(`Are you sure you want to delete ${hospital.hospital_name}?`)) {
      alert(`Delete functionality for ${hospital.hospital_name} - Coming soon!`);
      // TODO: Implement delete API call
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedHospital(null);
    setHospitalDetails(null);
  };

  const handleAddHospital = async (e) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!formData.hospital_name.trim()) {
      setFormError('Hospital name is required');
      return;
    }
    if (!formData.location.trim()) {
      setFormError('Location is required');
      return;
    }
    if (!formData.total_beds || formData.total_beds <= 0) {
      setFormError('Total beds must be greater than 0');
      return;
    }
    if (!formData.icu_beds || formData.icu_beds < 0) {
      setFormError('ICU beds must be 0 or greater');
      return;
    }
    if (parseInt(formData.icu_beds) > parseInt(formData.total_beds)) {
      setFormError('ICU beds cannot exceed total beds');
      return;
    }

    setSaving(true);
    try {
      const hospitalData = {
        hospital_name: formData.hospital_name.trim(),
        location: formData.location.trim(),
        total_beds: parseInt(formData.total_beds),
        icu_beds: parseInt(formData.icu_beds)
      };

      await createHospital(hospitalData);
      
      // Reset form and close modal
      setFormData({
        hospital_name: '',
        location: '',
        total_beds: '',
        icu_beds: ''
      });
      setShowAddModal(false);
      
      // Reload hospitals list
      await loadHospitals();
      
      alert('Hospital added successfully!');
    } catch (error) {
      console.error('Failed to add hospital:', error);
      setFormError(error.response?.data?.detail || 'Failed to add hospital. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setFormError('');
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setFormData({
      hospital_name: '',
      location: '',
      total_beds: '',
      icu_beds: ''
    });
    setFormError('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Hospitals</h1>
          <p className="text-gray-600">Manage hospital facilities and bed capacity</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Hospital
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search hospitals by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl p-6 border border-sky-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
              <Hospital className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-600">Total Hospitals</div>
              <div className="text-3xl font-bold text-gray-900">{hospitals.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Bed className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-600">Total Beds</div>
              <div className="text-3xl font-bold text-gray-900">
                {hospitals.reduce((sum, h) => sum + (h.total_beds || 0), 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 border border-red-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-600">ICU Beds</div>
              <div className="text-3xl font-bold text-gray-900">
                {hospitals.reduce((sum, h) => sum + (h.icu_beds || 0), 0)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-600">Locations</div>
              <div className="text-3xl font-bold text-gray-900">
                {new Set(hospitals.map(h => h.location)).size}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hospitals Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
        </div>
      ) : filteredHospitals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
          <Hospital className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Hospitals Found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first hospital'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-6 py-3 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Hospital
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredHospitals.map((hospital) => (
            <div
              key={hospital.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-sky-100 to-cyan-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Hospital className="w-7 h-7 text-sky-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {hospital.hospital_name}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{hospital.location}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(hospital)}
                    className="p-2 text-gray-600 hover:bg-sky-50 hover:text-sky-600 rounded-lg transition-colors"
                    title="Edit hospital"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(hospital)}
                    className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                    title="Delete hospital"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Bed className="w-4 h-4 text-gray-600" />
                    <span className="text-xs font-semibold text-gray-500">TOTAL BEDS</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{hospital.total_beds}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-4 h-4 text-gray-600" />
                    <span className="text-xs font-semibold text-gray-500">ICU BEDS</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{hospital.icu_beds}</div>
                </div>
              </div>

              {/* API Integration Status */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {hospital.api_enabled ? (
                      <>
                        <Wifi className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-600">API Connected</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-500">No API Integration</span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => handleConfigureAPI(hospital)}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Configure API"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                {hospital.api_enabled && hospital.last_sync && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <Clock className="w-3 h-3" />
                    <span>Last sync: {new Date(hospital.last_sync).toLocaleString()}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => handleViewDetails(hospital)}
                    className="px-4 py-2 bg-sky-50 text-sky-600 rounded-xl font-semibold hover:bg-sky-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  {hospital.api_enabled && (
                    <button
                      onClick={() => handleSyncNow(hospital)}
                      disabled={syncing}
                      className="px-4 py-2 bg-green-50 text-green-600 rounded-xl font-semibold hover:bg-green-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4" />
                      Sync
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Hospital Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-sky-50 to-cyan-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center">
                    <Plus className="w-6 h-6 text-sky-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Add New Hospital</h2>
                    <p className="text-sm text-gray-600">Enter hospital information below</p>
                  </div>
                </div>
                <button
                  onClick={closeAddModal}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                  disabled={saving}
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content - Form */}
            <form onSubmit={handleAddHospital} className="p-6 space-y-6">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              {/* Hospital Name */}
              <div>
                <label htmlFor="hospital_name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  id="hospital_name"
                  value={formData.hospital_name}
                  onChange={(e) => handleFormChange('hospital_name', e.target.value)}
                  placeholder="e.g., City General Hospital"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                  disabled={saving}
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                  placeholder="e.g., New York, NY"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                  disabled={saving}
                  required
                />
              </div>

              {/* Bed Capacity Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Total Beds */}
                <div>
                  <label htmlFor="total_beds" className="block text-sm font-semibold text-gray-700 mb-2">
                    Total Beds *
                  </label>
                  <div className="relative">
                    <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      id="total_beds"
                      value={formData.total_beds}
                      onChange={(e) => handleFormChange('total_beds', e.target.value)}
                      placeholder="0"
                      min="1"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                      disabled={saving}
                      required
                    />
                  </div>
                </div>

                {/* ICU Beds */}
                <div>
                  <label htmlFor="icu_beds" className="block text-sm font-semibold text-gray-700 mb-2">
                    ICU Beds *
                  </label>
                  <div className="relative">
                    <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      id="icu_beds"
                      value={formData.icu_beds}
                      onChange={(e) => handleFormChange('icu_beds', e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                      disabled={saving}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Add Hospital
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hospital Details Modal */}
      {showDetailsModal && selectedHospital && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-sky-50 to-cyan-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-sky-100 to-cyan-100 rounded-xl flex items-center justify-center">
                    <Hospital className="w-7 h-7 text-sky-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{selectedHospital.hospital_name}</h2>
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{selectedHospital.location}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeDetailsModal}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
                </div>
              ) : hospitalDetails ? (
                <div className="space-y-6">
                  {/* Capacity Overview */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Capacity Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Bed className="w-5 h-5 text-sky-600" />
                          <span className="text-xs font-semibold text-gray-600">TOTAL BEDS</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{selectedHospital.total_beds}</div>
                      </div>
                      <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Heart className="w-5 h-5 text-red-600" />
                          <span className="text-xs font-semibold text-gray-600">ICU BEDS</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{selectedHospital.icu_beds}</div>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-5 h-5 text-purple-600" />
                          <span className="text-xs font-semibold text-gray-600">OCCUPIED</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{hospitalDetails.current_occupied || 0}</div>
                      </div>
                      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-5 h-5 text-green-600" />
                          <span className="text-xs font-semibold text-gray-600">UTILIZATION</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{hospitalDetails.current_utilization?.toFixed(1) || 0}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Current Status */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Current Status</h3>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm text-gray-600">Overall Status</span>
                          <div className="mt-1">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              hospitalDetails.overall_status === 'green' ? 'bg-green-100 text-green-700' :
                              hospitalDetails.overall_status === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {hospitalDetails.overall_status === 'green' ? 'Normal' :
                               hospitalDetails.overall_status === 'yellow' ? 'Caution' : 'Critical'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">ICU Occupied</span>
                          <div className="text-xl font-bold text-gray-900 mt-1">
                            {hospitalDetails.current_icu_occupied || 0} / {selectedHospital.icu_beds}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alerts */}
                  {hospitalDetails.alerts && hospitalDetails.alerts.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Active Alerts</h3>
                      <div className="space-y-3">
                        {hospitalDetails.alerts.map((alert, index) => (
                          <div
                            key={index}
                            className={`p-4 rounded-xl border-l-4 ${
                              alert.severity === 'red' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 ${
                                alert.severity === 'red' ? 'text-red-500' : 'text-yellow-500'
                              }`}>
                                {alert.severity === 'red' ? '🔴' : '🟡'}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900 mb-1">
                                  {alert.severity === 'red' ? 'Critical Alert' : 'Warning'}
                                </p>
                                <p className="text-sm text-gray-700">{alert.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{alert.date}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Predictions */}
                  {hospitalDetails.predictions && hospitalDetails.predictions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4">7-Day Forecast</h3>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="space-y-2">
                          {hospitalDetails.predictions.slice(0, 7).map((pred, index) => (
                            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                              <span className="text-sm text-gray-600">{pred.date}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-semibold text-gray-900">
                                  {pred.predicted_occupancy.toFixed(0)} beds
                                </span>
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  (pred.predicted_occupancy / selectedHospital.total_beds) * 100 >= 85 ? 'bg-red-100 text-red-700' :
                                  (pred.predicted_occupancy / selectedHospital.total_beds) * 100 >= 70 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-green-100 text-green-700'
                                }`}>
                                  {((pred.predicted_occupancy / selectedHospital.total_beds) * 100).toFixed(0)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Failed to load hospital details
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={closeDetailsModal}
                className="w-full px-6 py-3 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Integration Modal */}
      {showAPIModal && selectedHospital && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                    <Wifi className="w-7 h-7 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">API Integration</h2>
                    <p className="text-sm text-gray-600">{selectedHospital.hospital_name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAPIModal(false)}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                  disabled={saving}
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content - Form */}
            <form onSubmit={handleSaveAPIConfig} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">📡 Real-Time Data Sync</h4>
                <p className="text-sm text-blue-700">
                  Connect your hospital's EHR system API for automatic bed occupancy updates. 
                  This enables real-time data synchronization without manual entry.
                </p>
              </div>

              {/* Enable API Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <label htmlFor="api_enabled" className="text-sm font-semibold text-gray-700">
                    Enable API Integration
                  </label>
                  <p className="text-xs text-gray-500 mt-1">Turn on to activate automatic data sync</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="api_enabled"
                    checked={apiConfig.api_enabled}
                    onChange={(e) => setApiConfig({ ...apiConfig, api_enabled: e.target.checked })}
                    className="sr-only peer"
                    disabled={saving}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>

              {apiConfig.api_enabled && (
                <>
                  {/* API Endpoint */}
                  <div>
                    <label htmlFor="api_endpoint" className="block text-sm font-semibold text-gray-700 mb-2">
                      API Endpoint URL *
                    </label>
                    <input
                      type="url"
                      id="api_endpoint"
                      value={apiConfig.api_endpoint}
                      onChange={(e) => setApiConfig({ ...apiConfig, api_endpoint: e.target.value })}
                      placeholder="https://your-hospital-api.com/ehr/occupancy"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      disabled={saving}
                      required={apiConfig.api_enabled}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Your hospital's EHR API endpoint that returns current bed occupancy data
                    </p>
                  </div>

                  {/* API Key */}
                  <div>
                    <label htmlFor="api_key" className="block text-sm font-semibold text-gray-700 mb-2">
                      API Key / Bearer Token
                    </label>
                    <input
                      type="password"
                      id="api_key"
                      value={apiConfig.api_key}
                      onChange={(e) => setApiConfig({ ...apiConfig, api_key: e.target.value })}
                      placeholder="Enter your API authentication key"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      disabled={saving}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Optional: Authentication key for secure API access
                    </p>
                  </div>

                  {/* Webhook URL */}
                  <div>
                    <label htmlFor="webhook_url" className="block text-sm font-semibold text-gray-700 mb-2">
                      Webhook URL (Optional)
                    </label>
                    <input
                      type="url"
                      id="webhook_url"
                      value={apiConfig.webhook_url}
                      onChange={(e) => setApiConfig({ ...apiConfig, webhook_url: e.target.value })}
                      placeholder="https://your-hospital-api.com/webhooks/bed-updates"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      disabled={saving}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Receive push notifications when occupancy changes
                    </p>
                  </div>

                  {/* Sync Interval */}
                  <div>
                    <label htmlFor="sync_interval" className="block text-sm font-semibold text-gray-700 mb-2">
                      Sync Interval (seconds)
                    </label>
                    <select
                      id="sync_interval"
                      value={apiConfig.sync_interval}
                      onChange={(e) => setApiConfig({ ...apiConfig, sync_interval: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      disabled={saving}
                    >
                      <option value="60">Every 1 minute</option>
                      <option value="300">Every 5 minutes (Recommended)</option>
                      <option value="600">Every 10 minutes</option>
                      <option value="1800">Every 30 minutes</option>
                      <option value="3600">Every hour</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-2">
                      How often to fetch data from your API
                    </p>
                  </div>

                  {/* API Notes */}
                  <div>
                    <label htmlFor="api_notes" className="block text-sm font-semibold text-gray-700 mb-2">
                      Additional Notes
                    </label>
                    <textarea
                      id="api_notes"
                      value={apiConfig.api_notes}
                      onChange={(e) => setApiConfig({ ...apiConfig, api_notes: e.target.value })}
                      placeholder="Any additional information about the API integration..."
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none resize-none"
                      disabled={saving}
                    />
                  </div>

                  {/* Expected Response Format */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">📋 Expected API Response Format</h4>
                    <pre className="text-xs text-gray-700 bg-white p-3 rounded-lg overflow-x-auto">
{`{
  "date": "2026-01-31",
  "occupied_beds": 150,
  "icu_occupied": 20,
  "admissions": 15,
  "discharges": 12,
  "emergency_cases": 8
}`}
                    </pre>
                  </div>
                </>
              )}

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAPIModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Wifi className="w-5 h-5" />
                      Save Configuration
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Hospital Modal */}
      {showEditModal && selectedHospital && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Edit2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Edit Hospital</h2>
                    <p className="text-sm text-gray-600">{selectedHospital.hospital_name}</p>
                  </div>
                </div>
                <button
                  onClick={closeEditModal}
                  className="p-2 hover:bg-white rounded-lg transition-colors"
                  disabled={saving}
                >
                  <X className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content - Form */}
            <form onSubmit={handleUpdateHospital} className="p-6 space-y-6">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700">{formError}</p>
                </div>
              )}

              {/* Hospital Name */}
              <div>
                <label htmlFor="edit_hospital_name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  id="edit_hospital_name"
                  value={formData.hospital_name}
                  onChange={(e) => handleFormChange('hospital_name', e.target.value)}
                  placeholder="e.g., City General Hospital"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  disabled={saving}
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label htmlFor="edit_location" className="block text-sm font-semibold text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  id="edit_location"
                  value={formData.location}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                  placeholder="e.g., Mumbai, Maharashtra"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  disabled={saving}
                  required
                />
              </div>

              {/* Bed Capacity Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Total Beds */}
                <div>
                  <label htmlFor="edit_total_beds" className="block text-sm font-semibold text-gray-700 mb-2">
                    Total Beds *
                  </label>
                  <div className="relative">
                    <Bed className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      id="edit_total_beds"
                      value={formData.total_beds}
                      onChange={(e) => handleFormChange('total_beds', e.target.value)}
                      placeholder="0"
                      min="1"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      disabled={saving}
                      required
                    />
                  </div>
                </div>

                {/* ICU Beds */}
                <div>
                  <label htmlFor="edit_icu_beds" className="block text-sm font-semibold text-gray-700 mb-2">
                    ICU Beds *
                  </label>
                  <div className="relative">
                    <Heart className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      id="edit_icu_beds"
                      value={formData.icu_beds}
                      onChange={(e) => handleFormChange('icu_beds', e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      disabled={saving}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-5 h-5" />
                      Update Hospital
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Hospitals;
