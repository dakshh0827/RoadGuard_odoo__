// src/components/Auth/ProtectedRoute.jsx - FIXED VERSION
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // FIXED: Correct import path
import Layout from '../Layout/Layout';

const ProtectedRoute = ({ children, requireVerified = true }) => {
  const { user, loading } = useAuth();

  console.log('ProtectedRoute - User:', user);
  console.log('ProtectedRoute - Loading:', loading);
  console.log('ProtectedRoute - RequireVerified:', requireVerified);

  if (loading) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  // Check if user exists and has valid token
  const token = localStorage.getItem('accessToken');
  if (!user || !token) {
    console.log('ProtectedRoute - No user or token, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check email verification if required
  if (requireVerified && !user.isVerified) {
    console.log('ProtectedRoute - User not verified, redirecting to verify-email');
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email)}`} replace />;
  }

  console.log('ProtectedRoute - All checks passed, rendering children');
  return children;
};

export default ProtectedRoute;