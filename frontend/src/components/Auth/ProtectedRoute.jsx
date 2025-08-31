import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false, requiresRole = null }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for admin-only routes
  if (adminOnly && !user.isAdmin) {
    console.log('🚫 Non-admin user trying to access admin route');
    return <Navigate to="/unauthorized" replace />;
  }

  // Check for specific role requirements
  if (requiresRole && user.role !== requiresRole) {
    console.log(`🚫 User with role ${user.role} trying to access ${requiresRole} route`);
    return <Navigate to="/unauthorized" replace />;
  }

  // Email verification check (skip for admin)
  if (!user.isAdmin && !user.emailVerified && !user.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  return children;
};

export default ProtectedRoute;