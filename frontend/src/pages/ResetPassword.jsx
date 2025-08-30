// src/pages/ResetPassword.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import OTPForm from '../components/Auth/OTPForm'; // Fixed import - use OTPForm, not OTPInput
import { useAuth } from '../context/AuthContext'; // Fixed import path
import { useApi } from '../Hooks/useAPI';
import { validateForm } from '../utils/validation';
import { ArrowLeft, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState('verify'); // Start with OTP verification step
  const [resendCooldown, setResendCooldown] = useState(0);
  
  const { user, loading: authLoading, resetPassword } = useAuth(); // Add resetPassword from context
  const { loading, error, makeRequest } = useApi();
  const location = useLocation();
  const navigate = useNavigate();
  
  const email = location.state?.email;

  // Redirect if no email provided or user is already logged in
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // If user is already logged in and verified, redirect to dashboard
  if (user && (user.emailVerified || user.isVerified)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Handle OTP verification success - move to password setup
  const handleOTPSuccess = () => {
    console.log('✅ OTP verified, moving to password setup');
    setStep('password');
  };

  // Handle OTP resend success  
  const handleOTPResend = () => {
    console.log('📧 Reset code resent successfully');
    setResendCooldown(60);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateForm({
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword
    }, ['newPassword', 'confirmPassword']);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    // Submit the password reset using your actual endpoint
    try {
      const result = await makeRequest(async () => {
        // Your backend expects: POST /auth/reset-password
        // It likely expects { email, otp, newPassword } or { email, newPassword, token }
        const response = await api.post('/auth/reset-password', {
          email,
          newPassword: formData.newPassword
          // Note: The OTP was already verified in the previous step
          // Your backend should handle this appropriately
        });
        return response;
      });

      if (result && result.success) {
        setStep('success');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      // Error is handled by useApi hook
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

  if (authLoading) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!email) {
    return null; // Will redirect via useEffect
  }

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            {step !== 'success' && (
              <Link 
                to="/forgot-password" 
                className="inline-flex items-center text-blue-600 hover:text-blue-500 mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            )}
            
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {step === 'verify' ? 'Verify Reset Code' : 
               step === 'password' ? 'Set New Password' : 
               'Password Reset Successful'}
            </h1>
            
            <p className="text-gray-600">
              {step === 'verify' ? `Enter the 6-digit code sent to ${email}` :
               step === 'password' ? 'Create a strong password for your account' :
               'Your password has been successfully reset'}
            </p>
          </div>

          <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
            {step === 'verify' && (
              <div className="space-y-6">
                <div className="flex justify-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Lock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>

                {/* Use OTPForm component correctly */}
                <OTPForm
                  email={email}
                  onSuccess={handleOTPSuccess}
                  onResend={handleOTPResend}
                  type="password_reset"
                  // Pass additional props to prevent auto-login
                  preventAutoRedirect={true}
                />

                <div className="text-center text-sm text-gray-600">
                  <p>Enter the 6-digit code to proceed with password reset</p>
                </div>
              </div>
            )}

            {step === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div className="flex justify-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Lock className="w-6 h-6 text-blue-600" />
                  </div>
                </div>

                <Input
                  label="New Password"
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  error={errors.newPassword}
                  placeholder="Enter new password"
                  required
                  autoComplete="new-password"
                  autoFocus
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  placeholder="Confirm new password"
                  required
                  autoComplete="new-password"
                />

                <div className="text-xs text-gray-500 space-y-1">
                  <p>Password requirements:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>At least 8 characters long</li>
                    <li>Include at least one uppercase letter</li>
                    <li>Include at least one lowercase letter</li>
                    <li>Include at least one number</li>
                  </ul>
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                    {error}
                  </div>
                )}

                <Button type="submit" loading={loading} className="w-full">
                  Reset Password
                </Button>

                <button
                  type="button"
                  onClick={() => setStep('verify')}
                  className="w-full text-sm text-gray-600 hover:text-gray-500 transition-colors"
                >
                  ← Back to verification
                </button>
              </form>
            )}

            {step === 'success' && (
              <div className="text-center space-y-6">
                <div className="flex justify-center mb-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    Password Reset Complete!
                  </h3>
                  <p className="text-sm text-gray-600">
                    Your password has been successfully reset. You can now sign in with your new password.
                  </p>
                </div>

                <Link to="/login" className="inline-block w-full">
                  <Button className="w-full">
                    Continue to Login
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ResetPassword;