// src/components/Auth/RoleProtectedRoute.jsx
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

  // If user doesn't have a role assigned yet
  if (!user.role) {
    return <Navigate to="/role-selection" replace />;
  }

  // If user's role is not in allowed roles for this route
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to their appropriate dashboard based on role
    const dashboardRoutes = {
      'CUSTOMER': '/dashboard',
      'MECHANIC': '/worker-dashboard',
      'ADMIN': '/admin-dashboard'
    };
    
    return <Navigate to={dashboardRoutes[user.role] || '/dashboard'} replace />;
  }

  // User is authenticated, verified, has role, and has permission
  return children;
};

export default RoleProtectedRoute;