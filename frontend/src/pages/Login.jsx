import React, { useEffect } from 'react';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import LoginForm from '../components/Auth/LoginForm';
import SocialAuth from '../components/Auth/SocialAuth';
import { useAuth } from '../Hooks/useAuth';

const Login = () => {
  const { user, loading, pendingVerificationEmail, setUserData } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Enhanced debugging
  console.log('🔍 Current URL:', window.location.href);
  console.log('🔍 Search params:', Object.fromEntries(searchParams.entries()));
  console.log('Login component - user:', user);
  console.log('Login component - loading:', loading);
  console.log('Login component - pendingVerificationEmail:', pendingVerificationEmail);

  useEffect(() => {
    console.log('🔄 useEffect triggered');
    
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const userParam = searchParams.get('user');

    console.log('🔍 OAuth params check:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasUserParam: !!userParam,
      accessToken: accessToken?.substring(0, 20) + '...' // Show partial for debugging
    });

    if (accessToken && refreshToken && userParam) {
      console.log('✅ All OAuth params present, processing...');
      
      try {
        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        console.log('✅ Tokens stored in localStorage');
        
        // Parse user data
        console.log('🔄 Raw user param:', userParam);
        const userData = JSON.parse(decodeURIComponent(userParam));
        console.log('✅ Parsed user data:', userData);
        
        // Set user data with a small delay to ensure context is ready
        setTimeout(() => {
          console.log('🔧 Calling setUserData...');
          setUserData(userData);
          console.log('✅ setUserData called');
        }, 100);
        
        // Clean URL
        setSearchParams({});
        console.log('✅ URL params cleaned');
        
      } catch (error) {
        console.error('❌ Error processing OAuth callback:', error);
        setSearchParams({});
      }
    } else {
      console.log('ℹ️ No OAuth params detected in URL');
    }
  }, [searchParams, setSearchParams, setUserData]);

  // Test button (remove after debugging)
  const testSetUser = () => {
    console.log('🧪 Testing setUserData manually...');
    setUserData({
      id: 'test123',
      email: 'test@test.com',
      firstName: 'Test',
      lastName: 'User',
      isVerified: true
    });
  };

  if (loading) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  // Rest of your redirect logic...
  if (pendingVerificationEmail) {
    console.log('🔄 Redirecting to verify-email');
    return <Navigate to="/verify-email" replace />;
  }

  if (user && (user.emailVerified || user.isVerified)) {
    console.log('🎯 Redirecting to dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  if (user && !user.emailVerified && !user.isVerified) {
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
