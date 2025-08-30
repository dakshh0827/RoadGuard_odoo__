// src/components/Auth/OTPForm.jsx - SIMPLIFIED VERSION using existing routes
import React, { useState, useRef, useEffect } from 'react';
import Button from '../UI/Button';
import { useAuth } from '../../context/AuthContext';

const OTPForm = ({ 
  email, 
  onSuccess, 
  onResend, 
  type = 'email_verification', // 'email_verification' | 'password_reset'
  preventAutoRedirect = false 
}) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);
  const { verifyOTP, resendOTP } = useAuth();

  // Debug: Log email prop
  useEffect(() => {
    console.log('OTPForm - Email prop received:', email);
    console.log('OTPForm - Type:', type);
    console.log('OTPForm - Email type:', typeof email);
    console.log('OTPForm - Email length:', email?.length);
  }, [email, type]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    setError('');
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = Array(6).fill('').map((_, i) => pastedData[i] || '');
    setOtp(newOtp);
    
    // Focus the next empty input or last input
    const nextEmptyIndex = newOtp.findIndex((digit, i) => !digit && i < 6);
    const focusIndex = nextEmptyIndex !== -1 ? nextEmptyIndex : 5;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    // Check email before making request
    console.log('OTPForm - handleSubmit - Email:', email);
    console.log('OTPForm - handleSubmit - OTP:', otpString);
    console.log('OTPForm - handleSubmit - Type:', type);

    if (!email || !email.trim()) {
      console.error('OTPForm - No email provided!');
      setError('Email is required for verification');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let response;
      
      if (type === 'password_reset') {
        // For password reset, call verifyOTP but with additional context
        console.log('OTPForm - Calling verifyOTP for password reset with:', { email: email.trim(), otp: otpString, type });
        
        // Try calling verifyOTP with type parameter through your API service
        try {
          response = await api.post('/auth/verify-otp', {
            email: email.trim(),
            otp: otpString,
            type: 'password_reset' // Add type to distinguish from email verification
          });
        } catch (firstError) {
          // Fallback: try with purpose instead of type
          try {
            response = await api.post('/auth/verify-otp', {
              email: email.trim(),
              otp: otpString,
              purpose: 'password_reset'
            });
          } catch (secondError) {
            // Last fallback: use your existing verifyOTP method
            response = await verifyOTP(email.trim(), otpString);
          }
        }
      } else {
        // Regular email verification
        console.log('OTPForm - Calling verifyOTP with:', { email: email.trim(), otp: otpString });
        response = await verifyOTP(email.trim(), otpString);
      }
      
      console.log('OTPForm - Verification response:', response);
      
      if (response.success) {
        // For password reset or when preventAutoRedirect is true, 
        // just call onSuccess without letting the auth context handle navigation
        console.log('OTPForm - Verification successful, calling onSuccess');
        onSuccess?.();
      } else {
        setError(response.message || 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      console.error('OTPForm - Verification error:', err);
      setError(err.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || !email.trim()) {
      setError('Email is required to resend OTP');
      return;
    }

    setResendLoading(true);
    try {
      // Use existing resendOTP method - your backend should handle the type
      await resendOTP(email.trim(), type === 'password_reset' ? 'password_reset' : 'verification');
      
      setTimer(60);
      setError('');
      onResend?.();
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  // Don't render if no email
  if (!email || !email.trim()) {
    console.error('OTPForm - No email provided, not rendering');
    return (
      <div className="text-center text-red-600 p-4 bg-red-50 rounded-lg">
        <p>Email is required for verification</p>
        <p className="text-xs mt-1">Received email: "{email || 'undefined'}"</p>
      </div>
    );
  }

  const getTitle = () => {
    if (type === 'password_reset') {
      return 'Verify Reset Code';
    }
    return 'Verify Your Email';
  };

  const getDescription = () => {
    if (type === 'password_reset') {
      return `We've sent a 6-digit reset code to ${email}`;
    }
    return `We've sent a 6-digit code to ${email}`;
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{getTitle()}</h2>
        <p className="text-gray-600">
          <span className="font-medium">{getDescription()}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center space-x-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="w-12 h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              disabled={loading}
            />
          ))}
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          loading={loading}
          disabled={otp.join('').length !== 6}
        >
          {type === 'password_reset' ? 'Verify Code' : 'Verify OTP'}
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Didn't receive the code?
          </p>
          {timer > 0 ? (
            <p className="text-sm text-gray-500">
              Resend in {timer}s
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendLoading}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {resendLoading ? 'Sending...' : 'Resend Code'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default OTPForm;