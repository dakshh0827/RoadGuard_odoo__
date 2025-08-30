// ServiceRequestForm.jsx - FIXED VERSION
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../UI/Input';
import Button from '../UI/Button';
import LocationPicker from './LocationPicker';
import { api } from '../../services/api';
import { SUCCESS_MESSAGES, ROUTES } from '../../utils/constants';

const ServiceRequestForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user from auth context
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serviceType: 'instant_service',
    issue: '',
    image: null,
    location: null,
    vehicleType: 'car',
    vehicleNumber: '',
    vehicleMake: '',
    vehicleModel: '',
    customerNotes: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image file is too large (max 5MB)');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only image files are allowed (JPEG, PNG, GIF, WebP)');
        return;
      }
      
      setFormData(prev => ({ ...prev, image: file }));
    }
    if (error) setError('');
  };

  const handleLocationChange = (newLocation) => {
    console.log('Location changed:', newLocation);
    setFormData(prev => ({ ...prev, location: newLocation }));
    if (error) setError('');
  };

  const validateForm = () => {
    // Check required fields
    if (!formData.name?.trim()) {
      setError('Name is required');
      return false;
    }
    
    if (!formData.description?.trim()) {
      setError('Description is required');
      return false;
    }
    
    if (!formData.serviceType) {
      setError('Service type is required');
      return false;
    }
    
    if (!formData.location) {
      setError('Location is required for service request');
      return false;
    }
    
    if (!formData.location.lat || !formData.location.lng) {
      setError('Valid GPS coordinates are required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setError('');
    setSuccess('');
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Double check authentication
      const token = localStorage.getItem('accessToken');
      if (!token || !user) {
        throw new Error('Authentication required. Please log in.');
      }

      // Prepare form data for submission
      const submissionData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        serviceType: formData.serviceType,
        issue: formData.issue?.trim() || formData.description.trim(),
        image: formData.image,
        location: {
          lat: formData.location.lat,
          lng: formData.location.lng,
          address: formData.location.address || 'Location not specified'
        },
        vehicleType: formData.vehicleType || 'car',
        vehicleNumber: formData.vehicleNumber?.trim() || null,
        vehicleMake: formData.vehicleMake?.trim() || formData.name.trim(),
        vehicleModel: formData.vehicleModel?.trim() || null,
        customerNotes: formData.customerNotes?.trim() || formData.issue?.trim() || null
      };

      console.log('Submitting service request with data:', submissionData);

      const result = await api.createServiceRequest(submissionData);

      if (result.success) {
        console.log('Service request created successfully:', result.data);
        setSuccess(SUCCESS_MESSAGES.SERVICE_REQUEST_CREATED);
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          serviceType: 'instant_service',
          issue: '',
          image: null,
          location: null,
          vehicleType: 'car',
          vehicleNumber: '',
          vehicleMake: '',
          vehicleModel: '',
          customerNotes: ''
        });
        
        // Reset file input
        const fileInput = document.getElementById('image');
        if (fileInput) {
          fileInput.value = '';
        }
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate(ROUTES.DASHBOARD);
        }, 2000);
      } else {
        // Handle server errors
        if (result.requiresVerification) {
          setError('Please verify your email before creating service requests');
          setTimeout(() => navigate('/verify-email'), 2000);
        } else if (result.requiresRoleSelection) {
          setError('Please complete your profile setup');
          setTimeout(() => navigate('/role-selection'), 2000);
        } else {
          setError(result.message || 'Failed to create service request');
        }
      }
    } catch (error) {
      console.error('Error submitting service request:', error);
      
      // Handle authentication errors
      if (error.message.includes('Access token is required') || 
          error.message.includes('Invalid or expired token') ||
          error.message.includes('Authentication required')) {
        setError('Your session has expired. Please log in again.');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setTimeout(() => navigate('/login'), 2000);
      } else if (error.message.includes('verify your email')) {
        setError('Please verify your email before creating service requests');
        setTimeout(() => navigate('/verify-email'), 2000);
      } else if (error.message.includes('role')) {
        setError('Please complete your profile setup');
        setTimeout(() => navigate('/role-selection'), 2000);
      } else {
        setError(error.message || 'Failed to create service request. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Request Service</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Success Message */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Vehicle Name/Identifier" 
            id="name" 
            name="name" 
            placeholder="e.g., My Honda Civic, Red Car"
            value={formData.name} 
            onChange={handleChange} 
            required
            disabled={isSubmitting}
          />
          
          <div>
            <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700 mb-1">
              Vehicle Type *
            </label>
            <select
              id="vehicleType"
              name="vehicleType"
              value={formData.vehicleType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
              required
            >
              <option value="car">Car</option>
              <option value="motorcycle">Motorcycle</option>
              <option value="truck">Truck</option>
              <option value="bus">Bus</option>
              <option value="auto_rickshaw">Auto Rickshaw</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Vehicle Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Vehicle Number" 
            id="vehicleNumber" 
            name="vehicleNumber" 
            placeholder="e.g., ABC-1234"
            value={formData.vehicleNumber} 
            onChange={handleChange} 
            disabled={isSubmitting}
          />
          
          <Input
            label="Vehicle Make" 
            id="vehicleMake" 
            name="vehicleMake" 
            placeholder="e.g., Honda, Toyota"
            value={formData.vehicleMake} 
            onChange={handleChange} 
            disabled={isSubmitting}
          />
          
          <Input
            label="Vehicle Model" 
            id="vehicleModel" 
            name="vehicleModel" 
            placeholder="e.g., Civic, Camry"
            value={formData.vehicleModel} 
            onChange={handleChange} 
            disabled={isSubmitting}
          />
        </div>
        
        <Input
          label="Vehicle Description" 
          id="description" 
          name="description" 
          placeholder="e.g., White Honda Civic 2019, front bumper damaged"
          value={formData.description} 
          onChange={handleChange} 
          required
          disabled={isSubmitting}
        />

        {/* Service Type Dropdown */}
        <div>
          <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-1">
            Service Type *
          </label>
          <select
            id="serviceType"
            name="serviceType"
            value={formData.serviceType}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
            required
          >
            <option value="instant_service">Emergency Assistance</option>
            <option value="towing">Towing</option>
            <option value="battery_jump">Battery Jump Start</option>
            <option value="tire_change">Tire Change</option>
            <option value="fuel_delivery">Fuel Delivery</option>
            <option value="engine_repair">Engine Repair</option>
            <option value="brake_repair">Brake Repair</option>
            <option value="electrical_issue">Electrical Issue</option>
            <option value="general_repair">General Repair</option>
          </select>
        </div>

        {/* Issue Description */}
        <div>
          <label htmlFor="issue" className="block text-sm font-medium text-gray-700 mb-1">
            Issue Description
          </label>
          <textarea
            id="issue"
            name="issue"
            placeholder="Describe the problem you're experiencing in detail..."
            value={formData.issue}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          />
        </div>

        {/* Customer Notes */}
        <div>
          <label htmlFor="customerNotes" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            id="customerNotes"
            name="customerNotes"
            placeholder="Any additional information for the mechanic..."
            value={formData.customerNotes}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSubmitting}
          />
        </div>
        
        {/* Image Upload */}
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
            Upload Image (Optional)
          </label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleFileChange}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: JPEG, PNG, GIF, WebP. Max size: 5MB
          </p>
        </div>
        
        {/* Location Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Location *
          </label>
          <LocationPicker 
            onLocationChange={handleLocationChange} 
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full" 
          size="lg"
          disabled={isSubmitting || !formData.location}
        >
          {isSubmitting ? 'Creating Request...' : 'Submit Service Request'}
        </Button>
      </form>
    </div>
  );
};

export default ServiceRequestForm;