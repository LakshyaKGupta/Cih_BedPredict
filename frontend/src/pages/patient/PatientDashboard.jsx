/**
 * Patient Dashboard - Find Hospitals
 * 
 * Search and view hospital availability with real-time status
 */

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Bed, Activity, AlertCircle, ChevronRight, ChevronLeft, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';
import { getPublicHospitals, getPublicAvailability } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { HospitalCardSkeleton } from '../../components/LoadingSkeleton';

const PatientDashboard = () => {
  const [hospitals, setHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [availabilities, setAvailabilities] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [liveUpdateTime, setLiveUpdateTime] = useState(new Date());
  const navigate = useNavigate();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (hospitals.length > 0) {
        refreshAvailabilities();
        setLiveUpdateTime(new Date());
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [hospitals]);

  const refreshAvailabilities = async () => {
    const availData = { ...availabilities };
    for (const hospital of hospitals) {
      try {
        const avail = await getPublicAvailability(hospital.id);
        availData[hospital.id] = avail;
      } catch (err) {
        // Silently handle
      }
    }
    setAvailabilities(availData);
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      const data = await getPublicHospitals();
      setHospitals(data);
      setFilteredHospitals(data);
      toast.success(`Loaded ${data.length} hospitals`);

      // Fetch availability for each hospital
      const availData = {};
      for (const hospital of data) {
        try {
          const avail = await getPublicAvailability(hospital.id);
          availData[hospital.id] = avail;
        } catch (err) {
          // Silently handle - some hospitals may not have data yet
          // This is expected and not an error
        }
      }
      setAvailabilities(availData);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      toast.error('Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = hospitals;

    if (cityFilter) {
      filtered = filtered.filter(h => h.location.includes(cityFilter));
    }

    if (searchTerm) {
      filtered = filtered.filter(h =>
        h.hospital_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredHospitals(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, cityFilter, hospitals]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHospitals = filteredHospitals.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHospitals.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const cities = [...new Set(hospitals.map(h => h.location))];

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'unknown': return 'bg-gray-100 text-gray-600 border-gray-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return '✓';
      case 'moderate': return '⚠';
      case 'high': return '⚠';
      case 'unknown': return '?';
      default: return '?';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Find Hospitals</h1>
          <p className="text-gray-600 mt-2">
            Search for hospitals and check real-time bed availability
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <HospitalCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Find Hospitals</h1>
        <p className="text-gray-600 mt-2">
          Search for hospitals and check real-time bed availability
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by hospital name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      {filteredHospitals.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <p className="text-sm text-gray-700">
            Found <span className="font-bold text-blue-600">{filteredHospitals.length}</span> hospital{filteredHospitals.length !== 1 ? 's' : ''}
            {filteredHospitals.length > itemsPerPage && (
              <span className="text-gray-500"> • Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredHospitals.length)}</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
              <Wifi className="w-3 h-3 animate-pulse" />
              Live Updates
            </span>
            <span className="text-xs text-gray-500">{liveUpdateTime.toLocaleTimeString()}</span>
          </div>
        </div>
      )}

      {/* Hospital Cards */}
      {currentHospitals.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentHospitals.map((hospital) => {
          const avail = availabilities[hospital.id];
          
          return (
            <div
              key={hospital.id}
              className="bg-white rounded-xl shadow-md border-2 border-gray-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-sky-50 to-blue-50 p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {hospital.hospital_name}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1.5 font-medium">
                      <MapPin className="w-4 h-4 text-sky-600" />
                      {hospital.location}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">

                {/* Availability Status */}
                {avail ? (
                  avail.status === 'unknown' ? (
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-center">
                      <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 font-medium mb-1">Data Coming Soon</p>
                      <p className="text-xs text-gray-500">Availability information will be available once data is collected</p>
                    </div>
                  ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-700">Current Status</span>
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border-2 ${getStatusColor(avail.status)} shadow-sm`}>
                        <span className="text-lg">{getStatusIcon(avail.status)}</span>
                        <span className="uppercase tracking-wide">{avail.status}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center gap-2 text-green-700 text-xs font-medium mb-2">
                          <Bed className="w-4 h-4" />
                          Available
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                          {avail.current_available}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">beds open</div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center gap-2 text-blue-700 text-xs font-medium mb-2">
                          <Activity className="w-4 h-4" />
                          Occupancy
                        </div>
                        <div className="text-3xl font-bold text-gray-900">
                          {avail.utilization_percentage.toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600 mt-1">capacity used</div>
                      </div>
                    </div>

                    {/* High Occupancy Warning */}
                    {avail.utilization_percentage >= 85 && (
                      <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                          <div className="text-xs text-red-900">
                            <p className="font-bold mb-1.5 text-sm">⚠️ High Occupancy Alert</p>
                            <p className="leading-relaxed">Long wait times expected. Consider visiting on a different day or check alternative hospitals.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  )
                ) : (
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 text-center">
                    <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 font-medium">Availability data unavailable</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-t-2 border-gray-200">
                <button
                  onClick={() => navigate(`/patient/forecast?hospital=${hospital.id}`)}
                  className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm py-3 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md"
                >
                  <span>View 7-Day Forecast</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-2 rounded-lg border ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex gap-1">
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                // Show first, last, current, and adjacent pages
                if (
                  pageNumber === 1 ||
                  pageNumber === totalPages ||
                  (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => paginate(pageNumber)}
                      className={`px-4 py-2 rounded-lg border font-medium ${
                        currentPage === pageNumber
                          ? 'bg-sky-600 text-white border-sky-600'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (
                  pageNumber === currentPage - 2 ||
                  pageNumber === currentPage + 2
                ) {
                  return <span key={pageNumber} className="px-2 py-2 text-gray-400">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-lg border ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border-2 border-gray-200 text-center py-16 px-6">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Hospitals Found</h3>
            <p className="text-gray-600 mb-6">We couldn't find any hospitals matching your search criteria.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setCityFilter('');
              }}
              className="px-6 py-3 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
