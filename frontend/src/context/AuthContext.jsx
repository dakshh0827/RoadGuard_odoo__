// src/context/AuthContext.jsx - COMPLETE UPDATE
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
      // Get token from localStorage
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
      // Clear invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('🚀 AuthContext - Login function called with:', email);
    
    const response = await api.post('/auth/login', { email, password });
    
    console.log('✅ AuthContext - Login response received:', response);
    
    if (response.success) {
      console.log('✅ AuthContext - Login successful');
      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      setUser(response.data.user);
      setPendingVerificationEmail(null);
    } else if (response.requiresVerification) {
      // Handle email verification requirement
      console.log('📧 AuthContext - Setting pendingVerificationEmail:', email);
      setPendingVerificationEmail(email);
      // DON'T throw an error - just return the response
      // This allows the Login component to re-render and detect pendingVerificationEmail
    }
    
    return response;
  };

  const signup = async (firstName, lastName, email, password) => {
    const response = await api.post('/auth/signup', { 
      firstName, 
      lastName, 
      email, 
      password 
    });
    
    if (response.success) {
      // Set pending verification email after successful signup
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
      // Clear tokens and user state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setPendingVerificationEmail(null);
    }
  };

  const verifyOTP = async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    
    if (response.success) {
      // Store tokens after successful verification
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      setUser(response.data.user);
      setPendingVerificationEmail(null); // Clear pending verification
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

  // ADD THIS METHOD: For OAuth login to manually set user data
  const setUserData = (userData) => {
    console.log('🔧 AuthContext - Setting user data manually:', userData);
    setUser(userData);
    setPendingVerificationEmail(null); // Clear any pending verification
  };

  // The value object that will be provided to all consuming components
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
    setUserData // ADD THIS LINE: Include setUserData in the context value
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
