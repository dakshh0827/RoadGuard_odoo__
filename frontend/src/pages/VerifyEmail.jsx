// src/pages/VerifyEmail.jsx - FIXED VERSION (redirects to role selection)
import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import OTPForm from '../components/Auth/OTPForm';
import Button from '../components/UI/Button';
import { useAuth } from '../context/AuthContext';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading, pendingVerificationEmail, clearPendingVerification, getUserDashboardRoute } = useAuth();
  const [email, setEmail] = useState(''); // Initialize as empty string
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [error, setError] = useState('');

  // FIXED: Get admin email safely
  const ADMIN_EMAIL = 'daksh.thakran05@gmail.com';
  const API_URL = 'http://localhost:5001/api';

  console.log('🔥 VerifyEmail - RENDER START');
  console.log('🔥 Current state:', { email, showOTPForm, successMessage, resendMessage, error });
  console.log('🔥 Auth context:', { user, loading, pendingVerificationEmail });

  // Helper function to determine redirect path after verification
  const getRedirectPath = (userRole, userEmail) => {
    // Admin users go to admin dashboard
    if (userEmail && ADMIN_EMAIL && userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      return '/admin-dashboard';
    }
    
    // Users with specific roles (MECHANIC) go to their dashboard
    if (userRole && userRole !== 'END_USER') {
      return getUserDashboardRoute();
    }
    
    // FIXED: Non-admin END_USER (customers) go to role selection
    return '/select-role';
  };

  useEffect(() => {
    console.log('🚀 VerifyEmail - useEffect triggered');
    
    // FIXED: Add safety checks for all email sources
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    
    console.log('📧 Email sources:', {
      emailParam,
      pendingVerificationEmail,
      userEmail: user?.email,
      userVerified: user?.isVerified || user?.emailVerified,
      loading
    });
    
    if (loading) {
      console.log('⏳ Still loading, exiting useEffect');
      return;
    }
    
    // FIXED: Priority order for determining email with safety checks
    let emailToUse = '';
    
    if (emailParam && typeof emailParam === 'string' && emailParam.trim()) {
      emailToUse = emailParam.trim();
      console.log('✅ Using email from URL params:', emailToUse);
    } else if (pendingVerificationEmail && typeof pendingVerificationEmail === 'string' && pendingVerificationEmail.trim()) {
      emailToUse = pendingVerificationEmail.trim();
      console.log('✅ Using pendingVerificationEmail:', emailToUse);
    } else if (user?.email && typeof user.email === 'string' && !user.isVerified && !user.emailVerified) {
      emailToUse = user.email.trim();
      console.log('✅ Using user email:', emailToUse);
    } else {
      console.log('❌ No valid email found in any source');
    }
    
    console.log('🎯 Final email determined:', emailToUse);
    
    if (emailToUse) {
      console.log('🔧 Setting email state and showing OTP form');
      setEmail(emailToUse);
      setShowOTPForm(true);
      setError('');
    } else {
      console.log('❌ No email - setting error');
      setError('No email available for verification. Please try logging in again.');
      setShowOTPForm(false);
    }
    
    if (tokenParam) {
      handleTokenVerification(tokenParam);
    }
  }, [searchParams, user, pendingVerificationEmail, loading]);

  const handleTokenVerification = async (token) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-email?token=${token}`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Email verified successfully! Redirecting...');
        
        setTimeout(() => {
          // FIXED: Use helper function to determine redirect path
          const redirectPath = getRedirectPath(data.data?.user?.role, email);
          console.log('🔄 Redirecting to:', redirectPath);
          navigate(redirectPath);
        }, 2000);
      } else {
        setError(data.message || 'Invalid verification token');
      }
    } catch (err) {
      setError('Failed to verify email. Please try again.');
    }
  };

  const handleOTPSuccess = (verificationResponse) => {
    console.log('✅ OTP verification successful', verificationResponse);
    setSuccessMessage('Email verified successfully! Redirecting...');
    setResendMessage('');
    clearPendingVerification();
    
    setTimeout(() => {
      // FIXED: Use helper function to determine redirect path
      const userRole = verificationResponse?.data?.user?.role || 'END_USER';
      const redirectPath = getRedirectPath(userRole, email);
      
      console.log('🔄 Redirecting to:', redirectPath, 'for role:', userRole);
      navigate(redirectPath);
    }, 2000);
  };

  const handleResendSuccess = () => {
    console.log('📧 OTP resent successfully');
    setResendMessage('Verification code sent successfully!');
    setError('');
    
    setTimeout(() => {
      setResendMessage('');
    }, 3000);
  };

  if (loading) {
    console.log('⏳ Rendering loading spinner');
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  // FIXED: Safe user verification status check
  if (user?.isVerified || user?.emailVerified) {
    console.log('✅ User already verified, determining redirect...');
    
    // FIXED: Use helper function for consistent redirect logic
    const redirectPath = getRedirectPath(user.role, user.email);
    return <Navigate to={redirectPath} replace />;
  }

  if (!loading && !email && !pendingVerificationEmail && !searchParams.get('email') && !user) {
    console.log('❌ No email sources available, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('🎨 Rendering main component. ShowOTPForm:', showOTPForm, 'Email:', email);

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
              <p className="text-gray-600">
                {email ? `Enter the verification code sent to ${email}` : 'Please verify your email address'}
              </p>
            </div>

            {successMessage && (
              <div className="mb-6 text-center">
                <div className="text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm">{successMessage}</p>
                </div>
              </div>
            )}

            {resendMessage && !successMessage && (
              <div className="mb-4 text-center">
                <div className="text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <p className="text-sm">{resendMessage}</p>
                </div>
              </div>
            )}
            
            {error && (
              <div className="mb-6 text-center">
                <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm">{error}</p>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/login')}
                    className="mt-3"
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            )}
            
            {/* Only render OTPForm if we have a valid email */}
            {email && showOTPForm && !successMessage && (
              <OTPForm
                email={email}
                onSuccess={handleOTPSuccess}
                onResend={handleResendSuccess}
              />
            )}

            {/* Show manual email entry if no email found */}
            {!email && !loading && (
              <div className="text-center space-y-4">
                <p className="text-gray-600">Enter your email to verify:</p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    onClick={() => {
                      if (email && typeof email === 'string' && email.trim()) {
                        setShowOTPForm(true);
                      } else {
                        setError('Please enter a valid email address');
                      }
                    }}
                    className="w-full"
                    disabled={!email || !email.trim()}
                  >
                    Verify Email
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default VerifyEmail;
