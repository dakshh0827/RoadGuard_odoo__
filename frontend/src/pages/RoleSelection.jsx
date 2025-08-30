// src/pages/RoleSelection.jsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import Button from '../components/UI/Button';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, setUserData } = useAuth();
  const navigate = useNavigate();

  // If user is not authenticated or not verified, redirect appropriately
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.isVerified && !user.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // If user already has a role (and it's not END_USER), redirect to appropriate dashboard
  if (user.role && user.role !== 'END_USER') {
    const dashboardRoutes = {
      'MECHANIC': '/worker-dashboard',
      'ADMIN': '/admin-dashboard'
    };
    return <Navigate to={dashboardRoutes[user.role] || '/dashboard'} replace />;
  }

  // Updated roles array
  const roles = [
    {
      id: 'CUSTOMER',
      title: 'Customer',
      description: 'Request vehicle repair and maintenance services',
      icon: '🚗',
      features: [
        'Request emergency roadside assistance',
        'Book repair appointments', 
        'Track service history',
        'Rate and review services'
      ]
    },
    {
      id: 'MECHANIC',
      title: 'Mechanic',
      description: 'Provide vehicle repair and maintenance services',
      icon: '🔧',
      features: [
        'Receive service requests',
        'Manage your availability',
        'Update service status',
        'Build your reputation'
      ]
    }
  ];

  // FIXED: Updated handleRoleSubmit with proper navigation handling
  const handleRoleSubmit = async () => {
    if (!selectedRole) {
      setError('Please select a role');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔄 Starting role selection for:', selectedRole);
      
      // Call the backend to set role and get tokens
      const response = await api.post('/auth/select-role', { 
        email: user.email,
        role: selectedRole 
      });
      
      console.log('📝 Role selection response:', response);

      if (response.success) {
        // Store the tokens from the response
        if (response.data.accessToken) {
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        // Update user data in context
        setUserData(response.data.user);
        
        // FIXED: Use replace: true and ensure proper navigation
        if (selectedRole === 'CUSTOMER') {
          console.log('🏠 Navigating to customer dashboard');
          navigate('/dashboard', { replace: true });
        } else if (selectedRole === 'MECHANIC') {
          console.log('🔧 Navigating to worker dashboard');
          navigate('/worker-dashboard', { replace: true });
        } else {
          console.log('🔄 Fallback navigation to dashboard');
          navigate('/dashboard', { replace: true });
        }
      } else {
        setError(response.message || 'Failed to set role');
      }
    } catch (err) {
      console.error('Role selection error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // FIXED: Add useEffect to handle navigation after user data updates
  // REMOVE this useEffect or make it less aggressive
useEffect(() => {
  // Only redirect if user has been updated AND we're not in the middle of role selection
  if (user && user.role && user.role !== 'END_USER' && !loading) {
    console.log('🎯 User role updated, navigating to appropriate dashboard');
    
    const dashboardRoutes = {
      'MECHANIC': '/worker-dashboard',
      'ADMIN': '/admin-dashboard'
    };
    
    const targetRoute = dashboardRoutes[user.role] || '/dashboard';
    navigate(targetRoute, { replace: true });
  }
}, [user?.role, navigate, loading]); // Add loading dependency

  return (
    <Layout showHeader={false}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Role</h1>
            <p className="text-gray-600 mb-8">
              Welcome {user?.firstName}! Please select how you'd like to use our platform.
            </p>
            {/* Debug info */}
            <div className="text-xs text-gray-400 mb-4">
              <p>User Role: {user?.role || 'No role'}</p>
              <p>Email: {user?.email}</p>
              <p>Verified: {user?.isVerified ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 text-center">
              <div className="text-red-600 bg-red-50 p-4 rounded-lg border border-red-200 max-w-md mx-auto">
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`
                  relative p-6 border-2 rounded-lg cursor-pointer transition-all duration-200
                  ${selectedRole === role.id 
                    ? 'border-blue-500 bg-blue-50 shadow-lg' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }
                `}
                onClick={() => {
                  setSelectedRole(role.id);
                  setError('');
                }}
              >
                {/* Radio button */}
                <div className="absolute top-4 right-4">
                  <div className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center
                    ${selectedRole === role.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}
                  `}>
                    {selectedRole === role.id && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                </div>

                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{role.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900">{role.title}</h3>
                  <p className="text-gray-600 text-sm mt-1">{role.description}</p>
                </div>

                <ul className="space-y-2">
                  {role.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-700">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3 flex-shrink-0"></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center max-w-md mx-auto">
            <Button
              onClick={handleRoleSubmit}
              loading={loading}
              disabled={!selectedRole}
              className="w-full py-3"
            >
              {loading ? 'Setting up your account...' : 'Continue'}
            </Button>
            
            <p className="text-xs text-gray-500 mt-4">
              You can change your role later in account settings
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default RoleSelection;
