import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Car, Wrench, AlertCircle, CheckCircle, Zap, Navigation, Target } from 'lucide-react';
import { api } from '../../services/api';

// --- Map Imports ---
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Fix for default Leaflet marker icon ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Helper component to change map view when location changes
const ChangeMapView = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords[0] && coords[1]) {
      map.flyTo(coords, 13, { animate: true, duration: 1.5 });
    }
  }, [coords, map]);
  return null;
};

const ServiceRequestForm = ({ theme = 'light' }) => {
  const [formData, setFormData] = useState({
    serviceType: '',
    vehicleType: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    description: '',
    address: '',
    coordinates: {
      latitude: null,
      longitude: null
    },
    preferredDateTime: '',
    urgency: 'NORMAL'
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [notification, setNotification] = useState(null);

  // Theme styles
  const themeStyles = {
    light: {
      bg: 'bg-gray-50',
      cardBg: 'bg-white',
      headerText: 'text-gray-900',
      bodyText: 'text-gray-700',
      mutedText: 'text-gray-500',
      border: 'border-gray-300',
      hoverBorder: 'hover:border-blue-400',
      inputBg: 'bg-white border-gray-300',
      inputFocus: 'focus:border-blue-500 focus:ring-blue-500/20',
      successBg: 'bg-green-50 border-green-300 text-green-800',
      errorBg: 'bg-red-50 border-red-300 text-red-800',
      warningBg: 'bg-yellow-50 border-yellow-300 text-yellow-800'
    },
    dark: {
      bg: 'bg-gray-900',
      cardBg: 'bg-gray-800',
      headerText: 'text-white',
      bodyText: 'text-gray-200',
      mutedText: 'text-gray-400',
      border: 'border-gray-600',
      hoverBorder: 'hover:border-blue-400',
      inputBg: 'bg-gray-700 border-gray-600 text-white',
      inputFocus: 'focus:border-blue-400 focus:ring-blue-400/20',
      successBg: 'bg-green-900/30 border-green-700 text-green-300',
      errorBg: 'bg-red-900/30 border-red-700 text-red-300',
      warningBg: 'bg-yellow-900/30 border-yellow-700 text-yellow-300'
    }
  };

  const styles = themeStyles[theme];

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setNotification({
        type: 'error',
        message: 'Geolocation is not supported by this browser.'
      });
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        setFormData(prev => ({
          ...prev,
          coordinates: { latitude, longitude }
        }));

        // Reverse geocoding to get address
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          const address = data.display_name || `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
          
          // Always update the address with the fetched result, overwriting any previous value.
          setFormData(prev => ({
            ...prev,
            address: address 
          }));

          setNotification({
            type: 'success',
            message: 'Location detected successfully!'
          });

        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          setNotification({
            type: 'warning',
            message: 'Location detected, but address lookup failed. Please enter address manually.'
          });
        }

        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        let message = 'Unable to get location: ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message += 'Location access denied. Please enable location access and try again.';
            setLocationPermission('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            message += 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            message += 'Location request timed out.';
            break;
          default:
            message += 'Unknown error occurred.';
            break;
        }
        
        setNotification({
          type: 'error',
          message
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.serviceType) newErrors.serviceType = 'Service type is required';
    if (!formData.vehicleType) newErrors.vehicleType = 'Vehicle type is required';
    if (!formData.vehicleMake) newErrors.vehicleMake = 'Vehicle make is required';
    if (!formData.vehicleModel) newErrors.vehicleModel = 'Vehicle model is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.description) newErrors.description = 'Description is required';

    if (!formData.coordinates.latitude || !formData.coordinates.longitude) {
      newErrors.location = 'Please allow location access or click "Get Current Location"';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setNotification({
        type: 'error',
        message: 'Please fix all errors before submitting.'
      });
      return;
    }

    setLoading(true);

    try {
      const submissionData = {
        serviceType: formData.serviceType,
        vehicleType: formData.vehicleType,
        vehicleMake: formData.vehicleMake,
        vehicleModel: formData.vehicleModel,
        vehicleYear: formData.vehicleYear || undefined,
        description: formData.description,
        address: formData.address,
        latitude: formData.coordinates.latitude,
        longitude: formData.coordinates.longitude,
        preferredDateTime: formData.preferredDateTime || undefined,
        urgency: formData.urgency
      };

      console.log('🚀 Submitting service request with data:', submissionData);

      const response = await api.createServiceRequest(submissionData);

      if (response.success) {
        setNotification({
          type: 'success',
          message: 'Service request submitted successfully! You will be redirected shortly.'
        });

        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);

      } else {
        throw new Error(response.message || 'Failed to submit service request');
      }
    } catch (error) {
      console.error('❌ Error submitting service request:', error);
      setNotification({
        type: 'error',
        message: error.message || 'Failed to submit service request. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Auto-hide notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const mapCenter = [
    formData.coordinates.latitude || 20.5937, // Default to center of India
    formData.coordinates.longitude || 78.9629
  ];
  const mapZoom = formData.coordinates.latitude ? 13 : 5;

  return (
    <div className="space-y-8">
      {notification && (
        <div className={`p-6 rounded-xl border-2 flex items-center gap-4 transition-all duration-300 transform hover:scale-105 ${
          notification.type === 'success' ? styles.successBg :
          notification.type === 'error' ? styles.errorBg :
          notification.type === 'warning' ? styles.warningBg :
          'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
        }`}>
          <div className="p-2 rounded-full bg-white/20">
            {notification.type === 'success' && <CheckCircle size={24} className="animate-bounce" />}
            {notification.type === 'error' && <AlertCircle size={24} className="animate-bounce" />}
            {notification.type === 'warning' && <AlertCircle size={24} className="animate-bounce" />}
            {notification.type === 'info' && <Zap size={24} className="animate-pulse" />}
          </div>
          <span className="font-bold text-lg flex-1">{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-auto hover:bg-black hover:bg-opacity-10 p-2 rounded-full transition-all duration-200 hover:scale-110"
          >
            ×
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Service Type */}
        <div className="space-y-3">
          <label className={`flex items-center gap-3 text-lg font-bold ${styles.headerText}`}>
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse">
              <Wrench size={20} className="text-white" />
            </div>
            Service Type *
          </label>
          <select 
            name="serviceType" 
            value={formData.serviceType} 
            onChange={handleChange}
            className={`w-full p-4 border-2 rounded-xl ${styles.inputBg} ${styles.inputFocus} ${styles.hoverBorder} transition-all duration-200 font-semibold text-base hover:shadow-lg ${ 
              errors.serviceType ? 'border-red-500 ring-2 ring-red-200' : styles.border 
            }`}
          >
            <option value="">Select service type</option>
            <option value="ENGINE_REPAIR">🔧 Engine Repair</option>
            <option value="BRAKE_SERVICE">🛑 Brake Service</option>
            <option value="OIL_CHANGE">🛢️ Oil Change</option>
            <option value="TIRE_SERVICE">🛞 Tire Service</option>
            <option value="BATTERY_SERVICE">🔋 Battery Service</option>
            <option value="AC_REPAIR">❄️ AC Repair</option>
            <option value="GENERAL_MAINTENANCE">⚙️ General Maintenance</option>
            <option value="EMERGENCY_REPAIR">🚨 Emergency Repair</option>
          </select>
          {errors.serviceType && <p className="text-red-500 text-base font-bold animate-pulse">{errors.serviceType}</p>}
        </div>

        {/* Vehicle Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className={`flex items-center gap-3 text-lg font-bold ${styles.headerText}`}>
              <div className="p-2 bg-gradient-to-r from-green-500 to-teal-600 rounded-full animate-pulse">
                <Car size={20} className="text-white" />
              </div>
              Vehicle Type *
            </label>
            <select 
              name="vehicleType" 
              value={formData.vehicleType} 
              onChange={handleChange}
              className={`w-full p-4 border-2 rounded-xl ${styles.inputBg} ${styles.inputFocus} ${styles.hoverBorder} transition-all duration-200 font-semibold text-base hover:shadow-lg ${ 
                errors.vehicleType ? 'border-red-500 ring-2 ring-red-200' : styles.border
              }`}
            >
              <option value="">Select vehicle type</option>
              <option value="CAR">🚗 Car</option>
              <option value="MOTORCYCLE">🏍️ Motorcycle</option>
              <option value="TRUCK">🚛 Truck</option>
              <option value="SUV">🚙 SUV</option>
              <option value="VAN">🚐 Van</option>
            </select>
            {errors.vehicleType && <p className="text-red-500 text-base font-bold animate-pulse">{errors.vehicleType}</p>}
          </div>

          <div className="space-y-3">
            <label className={`text-lg font-bold ${styles.headerText}`}>Vehicle Make *</label>
            <input 
              type="text" 
              name="vehicleMake" 
              value={formData.vehicleMake} 
              onChange={handleChange} 
              placeholder="e.g., Toyota, Honda, Ford, BMW"
              className={`w-full p-4 border-2 rounded-xl ${styles.inputBg} ${styles.inputFocus} ${styles.hoverBorder} transition-all duration-200 font-semibold text-base hover:shadow-lg ${ 
                errors.vehicleMake ? 'border-red-500 ring-2 ring-red-200' : styles.border 
              }`} 
            />
            {errors.vehicleMake && <p className="text-red-500 text-base font-bold animate-pulse">{errors.vehicleMake}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className={`text-lg font-bold ${styles.headerText}`}>Vehicle Model *</label>
            <input 
              type="text" 
              name="vehicleModel" 
              value={formData.vehicleModel} 
              onChange={handleChange} 
              placeholder="e.g., Camry, Civic, F-150, X3"
              className={`w-full p-4 border-2 rounded-xl ${styles.inputBg} ${styles.inputFocus} ${styles.hoverBorder} transition-all duration-200 font-semibold text-base hover:shadow-lg ${ 
                errors.vehicleModel ? 'border-red-500 ring-2 ring-red-200' : styles.border 
              }`}
            />
            {errors.vehicleModel && <p className="text-red-500 text-base font-bold animate-pulse">{errors.vehicleModel}</p>}
          </div>
          <div className="space-y-3">
            <label className={`text-lg font-bold ${styles.headerText}`}>Vehicle Year</label>
            <input 
              type="number" 
              name="vehicleYear" 
              value={formData.vehicleYear} 
              onChange={handleChange} 
              placeholder="e.g., 2020" 
              min="1990" 
              max={new Date().getFullYear() + 1}
              className={`w-full p-4 border-2 rounded-xl ${styles.inputBg} ${styles.inputFocus} ${styles.hoverBorder} transition-all duration-200 font-semibold text-base hover:shadow-lg`} 
            />
          </div>
        </div>

        {/* Location Section */}
        <div className="space-y-4">
          <label className={`flex items-center gap-3 text-lg font-bold ${styles.headerText}`}>
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full animate-pulse">
              <MapPin size={20} className="text-white" />
            </div>
            Location *
          </label>
          
          <button 
            type="button" 
            onClick={getCurrentLocation} 
            disabled={locationLoading}
            className={`w-full p-6 border-3 border-dashed rounded-xl font-bold text-lg transition-all duration-200 hover:shadow-xl transform hover:-translate-y-1 hover:scale-105 ${ 
              formData.coordinates.latitude ? 
                'border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 animate-pulse' : 
                `${styles.border} ${styles.hoverBorder} ${styles.bodyText} hover:text-blue-600 dark:hover:text-blue-400` 
            } ${locationLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {locationLoading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full"></div>
                <Navigation size={20} className="animate-bounce" />
                Getting your precise location...
              </div>
            ) : formData.coordinates.latitude ? (
              <div className="flex items-center justify-center gap-3">
                <CheckCircle size={24} className="animate-bounce" />
                <Target size={20} />
                Location detected successfully!
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <MapPin size={24} className="animate-pulse" />
                <Navigation size={20} />
                📍 Get Current Location
              </div>
            )}
          </button>
          
          {errors.location && <p className="text-red-500 text-base font-bold animate-pulse">{errors.location}</p>}

          <div className="h-72 rounded-xl overflow-hidden border-3 border-gray-300 dark:border-gray-600 shadow-lg hover:shadow-xl transition-shadow duration-200">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {formData.coordinates.latitude && formData.coordinates.longitude && (
                <Marker position={[formData.coordinates.latitude, formData.coordinates.longitude]}>
                  <Popup>📍 Your current location</Popup>
                </Marker>
              )}
              <ChangeMapView coords={[formData.coordinates.latitude, formData.coordinates.longitude]} />
            </MapContainer>
          </div>
          
          <input 
            type="text" 
            name="address" 
            value={formData.address} 
            onChange={handleChange} 
            placeholder="Enter your complete address or nearby landmark"
            className={`w-full p-4 border-2 rounded-xl ${styles.inputBg} ${styles.inputFocus} ${styles.hoverBorder} transition-all duration-200 font-semibold text-base hover:shadow-lg ${ 
              errors.address ? 'border-red-500 ring-2 ring-red-200' : styles.border 
            }`} 
          />
          {errors.address && <p className="text-red-500 text-base font-bold animate-pulse">{errors.address}</p>}
          
          {formData.coordinates.latitude && (
            <div className="text-sm font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-200 dark:border-green-700 animate-pulse">
              📍 Coordinates: {formData.coordinates.latitude.toFixed(4)}, {formData.coordinates.longitude.toFixed(4)}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-3">
          <label className={`text-lg font-bold ${styles.headerText}`}>Problem Description *</label>
          <textarea 
            name="description" 
            value={formData.description} 
            onChange={handleChange} 
            placeholder="Please describe the issue with your vehicle in detail. Include symptoms, when it started, any sounds, etc..."
            rows={5}
            className={`w-full p-4 border-2 rounded-xl ${styles.inputBg} ${styles.inputFocus} ${styles.hoverBorder} transition-all duration-200 font-semibold text-base hover:shadow-lg resize-none ${ 
              errors.description ? 'border-red-500 ring-2 ring-red-200' : styles.border 
            }`} 
          />
          {errors.description && <p className="text-red-500 text-base font-bold animate-pulse">{errors.description}</p>}
        </div>

        {/* Additional Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <label className={`flex items-center gap-3 text-lg font-bold ${styles.headerText}`}>
              <div className="p-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-full animate-pulse">
                <Clock size={20} className="text-white" />
              </div>
              Preferred Date/Time
            </label>
            <input 
              type="datetime-local" 
              name="preferredDateTime" 
              value={formData.preferredDateTime} 
              onChange={handleChange} 
              min={new Date().toISOString().slice(0, 16)}
              className={`w-full p-4 border-2 rounded-xl ${styles.inputBg} ${styles.inputFocus} ${styles.hoverBorder} transition-all duration-200 font-semibold text-base hover:shadow-lg`} 
            />
          </div>

          <div className="space-y-3">
            <label className={`text-lg font-bold ${styles.headerText}`}>Urgency Level</label>
            <select 
              name="urgency" 
              value={formData.urgency} 
              onChange={handleChange}
              className={`w-full p-4 border-2 rounded-xl ${styles.inputBg} ${styles.inputFocus} ${styles.hoverBorder} transition-all duration-200 font-semibold text-base hover:shadow-lg`}
            >
              <option value="LOW">🟢 Low Priority</option>
              <option value="NORMAL">🟡 Normal Priority</option>
              <option value="HIGH">🟠 High Priority</option>
              <option value="EMERGENCY">🔴 Emergency</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6">
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-6 px-8 rounded-xl font-black text-lg text-white transition-all duration-200 hover:shadow-2xl transform hover:-translate-y-2 hover:scale-105 ${ 
              loading ? 
                'bg-gray-400 cursor-not-allowed' : 
                'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 animate-pulse' 
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-3">
                <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
                🚀 Submitting Request...
              </div>
            ) : ( 
              <div className="flex items-center justify-center gap-3">
                <Zap size={24} />
                🚀 Submit Service Request
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceRequestForm;