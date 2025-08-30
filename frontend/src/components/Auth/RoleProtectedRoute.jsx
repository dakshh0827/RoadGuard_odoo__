// src/components/Auth/RoleProtectedRoute.jsx - FIXED VERSION
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RoleProtectedRoute = ({ children, allowedRoles = [], requireVerification = true }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If email verification is required and user is not verified
  if (requireVerification && !user.isVerified && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // FIXED: Handle role checking - if no roles specified, allow all authenticated users
  if (allowedRoles.length > 0) {
    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(user.role)) {
      // FIXED: Redirect to their appropriate dashboard based on actual role
      const dashboardRoutes = {
        'END_USER': '/dashboard',      // FIXED: Use END_USER instead of CUSTOMER
        'MECHANIC': '/worker-dashboard',
        'ADMIN': '/admin-dashboard'
      };
      
      return <Navigate to={dashboardRoutes[user.role] || '/dashboard'} replace />;
    }
  }

  // User is authenticated, verified, and has permission
  return children;
};

export default RoleProtectedRoute;
