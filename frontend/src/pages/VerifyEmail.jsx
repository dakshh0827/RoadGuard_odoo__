// src/pages/VerifyEmail.jsx - Updated with Role-Based Routing
import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import OTPForm from '../components/Auth/OTPForm';
import Button from '../components/UI/Button';
import { useAuth } from '../context/AuthContext';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading, pendingVerificationEmail, clearPendingVerification, getUserDashboardRoute, ADMIN_EMAIL } = useAuth();
  const [email, setEmail] = useState('');
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [error, setError] = useState('');

  console.log('🔥 VerifyEmail - RENDER START');
  console.log('🔥 Current state:', { email, showOTPForm, successMessage, resendMessage, error });
  console.log('🔥 Auth context:', { user, loading, pendingVerificationEmail });

  useEffect(() => {
    console.log('🚀 VerifyEmail - useEffect triggered');
    
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    
    console.log('📧 Email sources:', {
      emailParam,
      pendingVerificationEmail,
      userEmail: user?.email,
      userVerified: user?.isVerified || user?.emailVerified,
      loading
    });
    
    // Don't process if still loading
    if (loading) {
      console.log('⏳ Still loading, exiting useEffect');
      return;
    }
    
    // Priority order for determining email
    let emailToUse = '';
    
    if (emailParam && emailParam.trim()) {
      emailToUse = emailParam.trim();
      console.log('✅ Using email from URL params:', emailToUse);
    } else if (pendingVerificationEmail && pendingVerificationEmail.trim()) {
      emailToUse = pendingVerificationEmail.trim();
      console.log('✅ Using pendingVerificationEmail:', emailToUse);
    } else if (user?.email && !user.isVerified && !user.emailVerified) {
      emailToUse = user.email.trim();
      console.log('✅ Using user email:', emailToUse);
    } else {
      console.log('❌ No email found in any source');
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
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/verify-email?token=${token}`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Email verified successfully! Redirecting...');
        
        // Determine redirect based on role/admin status
        const redirectDelay = 2000;
        
        setTimeout(() => {
          if (email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            navigate('/admin-dashboard');
          } else if (user?.role) {
            navigate(getUserDashboardRoute());
          } else {
            navigate('/role-selection');
          }
        }, redirectDelay);
      } else {
        setError(data.message || 'Invalid verification token');
      }
    } catch (err) {
      setError('Failed to verify email. Please try again.');
    }
  };

  const handleOTPSuccess = () => {
    console.log('✅ OTP verification successful');
    setSuccessMessage('Email verified successfully! Redirecting...');
    setResendMessage('');
    clearPendingVerification();
    
    // Determine where to redirect after successful verification
    setTimeout(() => {
      if (email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        console.log('👑 Admin verification successful, redirecting to admin dashboard');
        navigate('/admin-dashboard');
      } else if (user?.role) {
        console.log('🎯 User has role, redirecting to their dashboard');
        navigate(getUserDashboardRoute());
      } else {
        console.log('🔄 User needs to select role, redirecting to role selection');
        navigate('/role-selection');
      }
    }, 2000);
  };

  const handleResendSuccess = () => {
    console.log('📧 OTP resent successfully');
    setResendMessage('Verification code sent successfully!');
    setError('');
    
    // Clear the resend message after 3 seconds
    setTimeout(() => {
      setResendMessage('');
    }, 3000);
  };

  // Loading state
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

  // If user is already verified, redirect based on role
  if (user?.isVerified || user?.emailVerified) {
    console.log('✅ User already verified, determining redirect...');
    
    if (user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      return <Navigate to="/admin-dashboard" replace />;
    } else if (user.role) {
      return <Navigate to={getUserDashboardRoute()} replace />;
    } else {
      return <Navigate to="/role-selection" replace />;
    }
  }

  // Only redirect to login if we're not loading and have no way to get email
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

            {/* Success Message (hides OTP form) */}
            {successMessage && (
              <div className="mb-6 text-center">
                <div className="text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm">{successMessage}</p>
                </div>
              </div>
            )}

            {/* Resend Message (doesn't hide OTP form) */}
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
            
            {/* Only render OTPForm if we have an email and no success message */}
            {email && showOTPForm && !successMessage && (
              <>
                <div className="bg-blue-100 p-2 text-xs mb-4 rounded">
                  <p>About to render OTPForm with email: "{email}"</p>
                </div>
                
                <OTPForm
                  email={email}
                  onSuccess={handleOTPSuccess}
                  onResend={handleResendSuccess}
                />
              </>
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
                      if (email.trim()) {
                        setShowOTPForm(true);
                      } else {
                        setError('Please enter a valid email address');
                      }
                    }}
                    className="w-full"
                    disabled={!email.trim()}
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