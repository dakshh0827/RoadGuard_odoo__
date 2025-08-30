// src/components/Auth/LoginForm.jsx - Updated to redirect to forgot password page
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../UI/Button';
import Input from '../UI/Input';
import { useAuth } from '../../context/AuthContext'; // Updated import path
import { useApi } from '../../Hooks/useAPI';
import { validateForm } from '../../utils/validation';
import { ROUTES } from '../../utils/constants';

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  
  const { login } = useAuth();
  const { loading, error, makeRequest } = useApi();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateForm(formData, ['email', 'password']);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    try {
      console.log('🎯 LoginForm - About to call login via makeRequest');
      
      const result = await makeRequest(() => login(formData.email, formData.password));
      console.log('🎯 LoginForm - Login result:', result);
      
      // Only navigate to dashboard if login was actually successful
      if (result && result.success) {
        navigate(ROUTES.DASHBOARD);
      } else if (result && result.requiresVerification) {
        console.log('🎯 LoginForm - Verification required, letting Login component handle redirect');
        // Don't do anything here - the Login component will detect pendingVerificationEmail and redirect
      }
    } catch (err) {
      console.log('🎯 LoginForm - Caught error:', err.message);
      // For any other errors, they'll be shown via the error state from useApi
    }
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle forgot password navigation
  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
        <p className="mt-2 text-sm text-gray-600">
          Sign in to your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="Enter your email"
          required
          autoComplete="email"
        />
        
        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          placeholder="Enter your password"
          required
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Forgot your password?
            </button>
          </div>
        </div>

        {error && !error.includes('verify your email') && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Sign In
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;
