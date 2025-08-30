// src/context/AuthContext.jsx - FIXED VERSION
import React, { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

export const AuthContext = createContext(null);

// Create and export the useAuth hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get('/auth/profile');
      if (response.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('🚀 AuthContext - Login function called with:', email);
    
    try {
      const response = await api.post('/auth/login', { email, password });
      console.log('✅ AuthContext - Login response received:', response);
      
      if (response.success) {
        console.log('✅ AuthContext - Login successful');
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        setUser(response.data.user);
        setPendingVerificationEmail(null);
      } else if (response.requiresVerification) {
        console.log('📧 AuthContext - Setting pendingVerificationEmail:', email);
        setPendingVerificationEmail(email);
      } else if (response.requiresRoleSelection) {
        // REMOVED: No longer needed since END_USER can login directly
        console.log('📋 AuthContext - Role selection no longer required for END_USER');
        // This case shouldn't happen with the fixed backend
      }
      
      return response;
    } catch (error) {
      console.error('❌ AuthContext - Login error:', error);
      throw error;
    }
  };

  const signup = async (firstName, lastName, email, password) => {
    const response = await api.post('/auth/signup', { 
      firstName, 
      lastName, 
      email, 
      password 
    });
    
    if (response.success) {
      setPendingVerificationEmail(email);
    }
    
    return response;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setPendingVerificationEmail(null);
    }
  };

  const verifyOTP = async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    
    if (response.success) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      setUser(response.data.user);
      setPendingVerificationEmail(null);
    }
    
    return response;
  };

  const resendOTP = async (email, type = 'verification') => {
    const response = await api.post('/auth/resend-otp', { email, type });
    return response;
  };

  const forgotPassword = async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response;
  };

  const resetPassword = async (email, otp, newPassword) => {
    const response = await api.post('/auth/reset-password', { 
      email, 
      otp, 
      newPassword 
    });
    return response;
  };

  const clearPendingVerification = () => {
    setPendingVerificationEmail(null);
  };

  const setUserData = (userData) => {
    console.log('🔧 AuthContext - Setting user data manually:', userData);
    setUser(userData);
    setPendingVerificationEmail(null);
  };

  // Helper function to check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Helper function to check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  // Get user's dashboard route based on role
  const getUserDashboardRoute = () => {
    if (!user?.role) return '/dashboard'; // Default for END_USER
    
    const dashboardRoutes = {
      'END_USER': '/dashboard',    // FIXED: END_USER = Customer
      'MECHANIC': '/worker-dashboard',
      'ADMIN': '/admin-dashboard'
    };
    
    return dashboardRoutes[user.role] || '/dashboard';
  };

  // Check if user is a customer (END_USER)
  const isCustomer = () => {
    return user?.role === 'END_USER';
  };

  // Check if user is a mechanic
  const isMechanic = () => {
    return user?.role === 'MECHANIC';
  };

  // Check if user is an admin
  const isAdmin = () => {
    return user?.role === 'ADMIN';
  };

  const value = {
    user,
    loading,
    pendingVerificationEmail,
    login,
    signup,
    logout,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    checkAuthStatus,
    setPendingVerificationEmail,
    clearPendingVerification,
    setUserData,
    // Role-based helper functions
    hasRole,
    hasAnyRole,
    getUserDashboardRoute,
    isCustomer,
    isMechanic,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
