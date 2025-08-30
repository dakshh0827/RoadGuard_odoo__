// src/components/Auth/ProtectedRoute.jsx - NEW FILE
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../Hooks/useAuth';
import Layout from '../Layout/Layout';

const ProtectedRoute = ({ children, requireVerified = true }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireVerified && !user.isVerified) {
    return <Navigate to={`/verify-email?email=${encodeURIComponent(user.email)}`} replace />;
  }

  return children;
};

export default ProtectedRoute;