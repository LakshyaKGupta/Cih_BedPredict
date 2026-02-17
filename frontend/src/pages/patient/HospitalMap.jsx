/**
 * Hospital Map Page - Patient View
 * 
 * Shows hospitals on an interactive map with:
 * - Current location of patient
 * - Nearby hospitals with bed availability
 * - Color-coded markers based on occupancy
 * - Click for details popup
 */

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Navigation, Bed, Activity, Phone, Clock } from 'lucide-react';
import { getPublicHospitals, getPublicAvailability } from '../../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons based on occupancy
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: 36px;
        height: 36px;
        background-color: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="1">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/>
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
};

// Indian city coordinates
const INDIAN_CITIES = {
  'Mumbai': { lat: 19.0760, lng: 72.8777 },
  'Delhi': { lat: 28.7041, lng: 77.1025 },
  'Bangalore': { lat: 12.9716, lng: 77.5946 },
  'Hyderabad': { lat: 17.3850, lng: 78.4867 },
  'Chennai': { lat: 13.0827, lng: 80.2707 },
  'Kolkata': { lat: 22.5726, lng: 88.3639 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
};

// Component to recenter map
const RecenterMap = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      console.log('Recentering map to:', position);
      map.setView(position, 13);
    }
  }, [position, map]);
  return null;
};

const HospitalMap = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // India center
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    console.log('HospitalMap component mounted');
    loadHospitals();
    getUserLocation();
  }, []);

  const loadHospitals = async () => {
    setLoading(true);
    try {
      console.log('Fetching hospitals from public API...');
      const data = await getPublicHospitals();
      console.log('Received', data.length, 'hospitals:', data);

      const hospitalsWithCoords = await Promise.all(data.map(async (hospital) => {
        const city = Object.keys(INDIAN_CITIES).find(c => 
          hospital.location.includes(c)
        );
        const coords = city ? INDIAN_CITIES[city] : { lat: 20.5937, lng: 78.9629 };

        let availability = null;
        try {
          availability = await getPublicAvailability(hospital.id);
        } catch (availabilityError) {
          console.error(`Failed to load availability for hospital ${hospital.id}:`, availabilityError);
        }

        const occupancy = availability?.utilization_percentage ?? 0;
        const availableBeds = availability?.current_available ?? hospital.total_beds;
        
        console.log(`Hospital: ${hospital.hospital_name}, City: ${city}, Coords: ${coords.lat}, ${coords.lng}`);
        
        return {
          ...hospital,
          latitude: coords.lat,
          longitude: coords.lng,
          currentOccupancy: occupancy,
          availableBeds: availableBeds
        };
      }));
      
      setHospitals(hospitalsWithCoords);
      console.log('Loaded hospitals with coords:', hospitalsWithCoords);
      setError(null);
    } catch (error) {
      console.error('Failed to load hospitals:', error);
      setError('Failed to load hospitals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      console.log('Requesting geolocation...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('Got location:', latitude, longitude);
          setUserLocation({ lat: latitude, lng: longitude });
          setMapCenter([latitude, longitude]);
        },
        (error) => {
          console.error('Geolocation error:', error.message);
          // Default to Mumbai if location not available
          setMapCenter([19.0760, 72.8777]);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } else {
      console.log('Geolocation not supported');
      setMapCenter([19.0760, 72.8777]);
    }
  };

  const getMarkerColor = (occupancy) => {
    if (occupancy >= 85) return '#ef4444'; // Red - Critical
    if (occupancy >= 70) return '#f59e0b'; // Orange - High
    if (occupancy >= 50) return '#eab308'; // Yellow - Medium
    return '#22c55e'; // Green - Available
  };

  const getStatusText = (occupancy) => {
    if (occupancy >= 85) return 'Critical';
    if (occupancy >= 70) return 'High';
    if (occupancy >= 50) return 'Moderate';
    return 'Available';
  };

  const filteredHospitals = hospitals.filter(hospital => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'available') return hospital.currentOccupancy < 70;
    if (selectedFilter === 'moderate') return hospital.currentOccupancy >= 50 && hospital.currentOccupancy < 85;
    if (selectedFilter === 'critical') return hospital.currentOccupancy >= 85;
    return true;
  });

  console.log('Filter:', selectedFilter, '| Total:', hospitals.length, '| Filtered:', filteredHospitals.length);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Hospital Map</h1>
            <p className="text-gray-600">Find nearby hospitals with available beds • Showing {filteredHospitals.length} of {hospitals.length} hospitals</p>
          </div>
          <button
            onClick={getUserLocation}
            className="px-4 py-2 bg-sky-600 text-white rounded-xl font-semibold hover:bg-sky-700 transition-all flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            My Location
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => {
              console.log('Filter clicked: all');
              setSelectedFilter('all');
            }}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
              selectedFilter === 'all'
                ? 'bg-sky-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Hospitals
          </button>
          <button
            onClick={() => {
              console.log('Filter clicked: available');
              setSelectedFilter('available');
            }}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
              selectedFilter === 'available'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Available
          </button>
          <button
            onClick={() => {
              console.log('Filter clicked: moderate');
              setSelectedFilter('moderate');
            }}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
              selectedFilter === 'moderate'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Moderate
          </button>
          <button
            onClick={() => {
              console.log('Filter clicked: critical');
              setSelectedFilter('critical');
            }}
            className={`px-4 py-2 rounded-xl font-semibold transition-colors ${
              selectedFilter === 'critical'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Critical
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-[600px]">
        {loading ? (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading hospitals...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center max-w-md p-6">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <p className="text-red-600 text-lg font-semibold mb-2">{error}</p>
              <button
                onClick={loadHospitals}
                className="mt-4 px-6 py-2 bg-sky-600 text-white rounded-xl hover:bg-sky-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : hospitals.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-gray-50">
            <div className="text-center max-w-md p-6">
              <div className="text-gray-400 text-5xl mb-4">🏥</div>
              <p className="text-gray-600 text-lg">No hospitals found</p>
            </div>
          </div>
        ) : (
          <MapContainer
            center={mapCenter}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
            key={`map-${mapCenter[0]}-${mapCenter[1]}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              subdomains='abcd'
              maxZoom={20}
            />
            
            <RecenterMap position={userLocation} />

            {/* User location marker */}
            {userLocation && (
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup>
                  <div className="text-center font-semibold">
                    📍 Your Location
                  </div>
                </Popup>
              </Marker>
            )}

            {/* Hospital markers */}
            {filteredHospitals.map((hospital) => (
              <Marker
                key={hospital.id}
                position={[hospital.latitude, hospital.longitude]}
                icon={createCustomIcon(getMarkerColor(hospital.currentOccupancy))}
              >
                <Popup className="custom-popup">
                  <div className="p-2 min-w-[250px]">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {hospital.hospital_name}
                    </h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{hospital.location}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Bed className="w-4 h-4 text-sky-600" />
                        <span className="font-semibold text-gray-900">
                          {hospital.availableBeds} / {hospital.total_beds} beds available
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-600" />
                        <span>Occupancy: {hospital.currentOccupancy}%</span>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          hospital.currentOccupancy >= 85 ? 'bg-red-100 text-red-700' :
                          hospital.currentOccupancy >= 70 ? 'bg-orange-100 text-orange-700' :
                          hospital.currentOccupancy >= 50 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {getStatusText(hospital.currentOccupancy)}
                        </span>
                      </div>
                      
                      <div className="pt-2 border-t border-gray-200">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${hospital.latitude},${hospital.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full px-3 py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-colors text-center"
                        >
                          Get Directions
                        </a>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}

        {/* Legend */}
        <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-4 z-[1000] border border-gray-200">
          <h4 className="text-sm font-bold text-gray-900 mb-3">Occupancy Status</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-white shadow-md"></div>
              <span className="text-xs text-gray-700 font-medium">Available (&lt;50%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-yellow-500 border-2 border-white shadow-md"></div>
              <span className="text-xs text-gray-700 font-medium">Moderate (50-69%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-orange-500 border-2 border-white shadow-md"></div>
              <span className="text-xs text-gray-700 font-medium">High (70-84%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white shadow-md"></div>
              <span className="text-xs text-gray-700 font-medium">Critical (≥85%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalMap;
