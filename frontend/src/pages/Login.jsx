import React, { useEffect } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import LoginForm from '../components/Auth/LoginForm';
import SocialAuth from '../components/Auth/SocialAuth';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { user, loading, pendingVerificationEmail, setUserData, getUserDashboardRoute, ADMIN_EMAIL } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Enhanced debugging
  console.log('🔍 Login component - user:', user);
  console.log('🔍 Login component - loading:', loading);
  console.log('🔍 Login component - pendingVerificationEmail:', pendingVerificationEmail);

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const userParam = searchParams.get('user');

    if (accessToken && refreshToken && userParam) {
      console.log('✅ OAuth params present, processing...');
      
      try {
        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Parse user data
        const userData = JSON.parse(decodeURIComponent(userParam));
        console.log('✅ Parsed OAuth user data:', userData);
        
        // Check if this is an admin user (OAuth admin login)
        if (userData.email && userData.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
          userData.role = 'ADMIN';
          userData.isAdmin = true;
          console.log('👑 Admin OAuth login detected');
        }
        
        // Set user data
        setTimeout(() => {
          setUserData(userData);
        }, 100);
        
        // Clean URL
        setSearchParams({});
        
      } catch (error) {
        console.error('❌ Error processing OAuth callback:', error);
        setSearchParams({});
      }
    }
  }, [searchParams, setSearchParams, setUserData, ADMIN_EMAIL]);

  if (loading) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  // If there's a pending verification email, redirect to verify-email
  if (pendingVerificationEmail) {
    console.log('🔄 Redirecting to verify-email');
    return <Navigate to="/verify-email" replace />;
  }

  // If user is authenticated and verified
  if (user && (user.emailVerified || user.isVerified)) {
    // Check if user is admin - prioritize isAdmin flag first
    if (user.isAdmin || (user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase())) {
      console.log('👑 Admin user detected, redirecting to admin dashboard');
      return <Navigate to="/admin-dashboard" replace />;
    }
    
    // If user has a role, redirect to their dashboard
    if (user.role) {
      console.log('🎯 Redirecting to role-based dashboard:', getUserDashboardRoute());
      return <Navigate to={getUserDashboardRoute()} replace />;
    } else {
      // User is verified but hasn't selected a role yet
      console.log('🔄 Redirecting to role selection');
      return <Navigate to="/role-selection" replace />;
    }
  }

  // If user exists but is not verified (skip for admin)
  if (user && !user.isAdmin && !user.emailVerified && !user.isVerified) {
    console.log('📧 Redirecting to verify-email');
    return <Navigate to="/verify-email" replace />;
  }

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          
          <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
            <div className="space-y-6">
              <LoginForm />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>
              
              <SocialAuth />
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Sign up here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Login;