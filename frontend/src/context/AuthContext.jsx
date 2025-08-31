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

  // Admin credentials - In production, these should be in environment variables
  const ADMIN_EMAIL = 'daksh.thakran05@gmail.com';
  const ADMIN_PASSWORD = 'thakran827@DT';

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Check if user is admin based on credentials
  const isAdminCredentials = (email, password) => {
    return email.toLowerCase() === ADMIN_EMAIL.toLowerCase() && password === ADMIN_PASSWORD;
  };

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Check if this is an admin session
      const isAdminStored = localStorage.getItem('isAdmin');
      const adminEmail = localStorage.getItem('adminEmail');
      
      if (isAdminStored === 'true' && adminEmail === ADMIN_EMAIL) {
        // For admin sessions, we don't validate with the API since it's client-side only
        const adminUser = {
          id: 'admin-1',
          email: ADMIN_EMAIL,
          role: 'ADMIN',
          isAdmin: true,
          emailVerified: true,
          isVerified: true,
          name: 'Admin',
          firstName: 'Admin',
          lastName: 'User'
        };
        setUser(adminUser);
        console.log('👑 Admin session restored');
        setLoading(false);
        return;
      }

      // For regular users, validate with API
      const response = await api.get('/auth/profile');
      if (response.success) {
        setUser({
          ...response.data.user,
          isAdmin: false
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('adminEmail');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    console.log('🚀 AuthContext - Login function called with:', email);
    
    try {
      // Check for admin credentials first
      if (isAdminCredentials(email, password)) {
        console.log('👑 Admin login detected');
        
        // Create admin user object
        const adminUser = {
          id: 'admin-1',
          email: ADMIN_EMAIL,
          role: 'ADMIN',
          isAdmin: true,
          emailVerified: true,
          isVerified: true,
          name: 'Admin',
          firstName: 'Admin',
          lastName: 'User',
          createdAt: new Date().toISOString()
        };
        
        // Store admin session with a special token that the API service will recognize
        localStorage.setItem('isAdmin', 'true');
        localStorage.setItem('adminEmail', ADMIN_EMAIL);
        localStorage.setItem('accessToken', 'ADMIN_BYPASS_TOKEN');
        
        // Set user state
        setUser(adminUser);
        setPendingVerificationEmail(null);
        
        return { success: true, user: adminUser, isAdmin: true };
      }

      // For non-admin users, use the regular API authentication
      const response = await api.post('/auth/login', { email, password });
      console.log('✅ AuthContext - Login response received:', response);
      
      if (response.success) {
        console.log('✅ AuthContext - Login successful');
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        
        // Ensure the user is marked as non-admin
        const userData = {
          ...response.data.user,
          isAdmin: false
        };
        
        setUser(userData);
        setPendingVerificationEmail(null);
      } else if (response.requiresVerification) {
        console.log('📧 AuthContext - Setting pendingVerificationEmail:', email);
        setPendingVerificationEmail(email);
      } else if (response.requiresRoleSelection) {
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
    // Prevent signup with admin email
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      throw new Error('This email address is not available for signup');
    }

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
      // Only call API logout for non-admin users
      if (!user?.isAdmin) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('isAdmin');
      localStorage.removeItem('adminEmail');
      setUser(null);
      setPendingVerificationEmail(null);
      console.log('🚪 User logged out');
    }
  };

  const verifyOTP = async (email, otp) => {
    const response = await api.post('/auth/verify-otp', { email, otp });
    
    if (response.success) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      // Ensure the user is marked as non-admin
      const userData = {
        ...response.data.user,
        isAdmin: false
      };
      
      setUser(userData);
      setPendingVerificationEmail(null);
    }
    
    return response;
  };

  const resendOTP = async (email, type = 'verification') => {
    const response = await api.post('/auth/resend-otp', { email, type });
    return response;
  };

  const forgotPassword = async (email) => {
    // Prevent password reset for admin email
    if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      throw new Error('Password reset is not available for this email address');
    }
    
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
    
    // Check if this should be treated as admin based on email (for OAuth scenarios)
    if (userData.email && userData.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      // For OAuth admin login, we need to verify they have admin privileges
      userData.role = 'ADMIN';
      userData.isAdmin = true;
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('adminEmail', userData.email);
    } else {
      userData.isAdmin = false;
    }
    
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
    if (!user) return '/login';
    
    // Admin gets admin dashboard
    if (user.isAdmin || user.role === 'ADMIN') {
      return '/admin-dashboard';
    }
    
    // Role-based routing for regular users
    const dashboardRoutes = {
      'END_USER': '/dashboard',    // Customer dashboard
      'MECHANIC': '/worker-dashboard',
      'ADMIN': '/admin-dashboard'
    };
    
    return dashboardRoutes[user.role] || '/dashboard';
  };

  // Check if user is a customer (END_USER)
  const isCustomer = () => {
    return user?.role === 'END_USER' && !user?.isAdmin;
  };

  // Check if user is a mechanic
  const isMechanic = () => {
    return user?.role === 'MECHANIC' && !user?.isAdmin;
  };

  // Check if user is an admin
  const isAdmin = () => {
    return user?.isAdmin === true || user?.role === 'ADMIN';
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
    // Admin-specific
    ADMIN_EMAIL,
    isAdminUser: isAdmin() // Alias for clarity
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};