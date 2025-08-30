// src/components/Auth/DashboardSelector.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const DashboardSelector = () => {
  const { user, loading, getUserDashboardRoute } = useAuth();

  // Show loading while checking auth
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

  // If not verified, redirect to verification
  if (!user.isVerified && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // Get the appropriate dashboard route and redirect
  const dashboardRoute = getUserDashboardRoute();
  return <Navigate to={dashboardRoute} replace />;
};

export default DashboardSelector;