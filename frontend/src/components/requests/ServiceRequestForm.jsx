// ServiceRequestForm.jsx - Remove the manual fetch, use api service
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../UI/Input';
import Button from '../UI/Button';
import LocationPicker from './LocationPicker';
import { api } from '../../services/api';
import { SUCCESS_MESSAGES, ROUTES } from '../../utils/constants';

const ServiceRequestForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    serviceType: 'instant_service',
    issue: '',
    image: null,
    location: null,
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
    setFormData(prev => ({ ...prev, image: e.target.files[0] }));
    if (error) setError('');
  };

  const handleLocationChange = (newLocation) => {
    setFormData(prev => ({ ...prev, location: newLocation }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      // Check if user is logged in
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Please log in to create a service request');
        navigate('/login');
        return;
      }

      const result = await api.createServiceRequest(formData);

      if (result.success) {
        console.log('Service request created:', result.data);
        setSuccess(SUCCESS_MESSAGES.SERVICE_REQUEST_CREATED);
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          serviceType: 'instant_service',
          issue: '',
          image: null,
          location: null,
        });
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate(ROUTES.DASHBOARD);
        }, 2000);
      } else {
        setError(result.message || 'Failed to create service request');
      }
    } catch (error) {
      console.error('Error submitting service request:', error);
      
      // Handle authentication errors
      if (error.message.includes('Access token is required') || 
          error.message.includes('Invalid or expired token')) {
        setError('Please log in to create a service request');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(error.message || 'Failed to create service request. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Rest of your component remains the same...
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <Input
        label="Name" 
        id="name" 
        name="name" 
        placeholder="e.g., My Car"
        value={formData.name} 
        onChange={handleChange} 
        required
        disabled={isSubmitting}
      />
      
      <Input
        label="Description" 
        id="description" 
        name="description" 
        placeholder="e.g., Toyota Camry 2021, White"
        value={formData.description} 
        onChange={handleChange} 
        required
        disabled={isSubmitting}
      />

      {/* Service Type Dropdown */}
      <div>
        <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-1">
          Service Type
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

      <div>
        <label htmlFor="issue" className="block text-sm font-medium text-gray-700 mb-1">
          Issue Description
        </label>
        <textarea
          id="issue"
          name="issue"
          placeholder="Describe the issue you're experiencing..."
          value={formData.issue}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        />
      </div>
      
      <Input
        label="Upload Image" 
        id="image" 
        name="image" 
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isSubmitting}
      />
      
      <LocationPicker 
        onLocationChange={handleLocationChange} 
        disabled={isSubmitting}
      />

      <Button 
        type="submit" 
        className="w-full" 
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Creating Request...' : 'Proceed to Checkout'}
      </Button>
    </form>
  );
};

export default ServiceRequestForm;
