// src/pages/SelectRole.jsx
import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import RoleSelection from '../components/Auth/RoleSelection';
import { useAuth } from '../Hooks/useAuth';

const SelectRole = () => {
  const { user, loading, pendingVerificationEmail, setUserData } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  console.log('SelectRole - user:', user);
  console.log('SelectRole - loading:', loading);
  console.log('SelectRole - pendingVerificationEmail:', pendingVerificationEmail);

  // Loading state
  if (loading) {
    return (
      <Layout showHeader={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  // Redirect if no user or not verified
  if (!user || !user.isVerified) {
    return <Navigate to="/login" replace />;
  }

  // If user already has a role, redirect to dashboard
  if (user.role) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleRoleSelect = async (selectedRole) => {
    try {
      setError('');
      setSuccess('');

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/select-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: user.email,
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store tokens
        if (data.data.accessToken) {
          localStorage.setItem('accessToken', data.data.accessToken);
        }
        if (data.data.refreshToken) {
          localStorage.setItem('refreshToken', data.data.refreshToken);
        }

        // Update user context
        setUserData(data.data.user);

        setSuccess('Role selected successfully! Redirecting to dashboard...');
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(data.message || 'Failed to select role');
      }
    } catch (err) {
      console.error('Role selection error:', err);
      setError('An error occurred while selecting your role. Please try again.');
    }
  };

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-lg w-full space-y-8">
          <div className="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
            {error && (
              <div className="mb-6">
                <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div className="mb-6">
                <div className="text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-sm">{success}</p>
                </div>
              </div>
            )}

            {!success && (
              <RoleSelection
                email={user.email}
                onRoleSelect={handleRoleSelect}
                loading={loading}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SelectRole;