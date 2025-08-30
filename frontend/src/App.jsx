// src/App.jsx - FIXED VERSION
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import RoleSelection from './pages/RoleSelection';
import Dashboard from './pages/Dashboard';
import WorkshopDetailPage from './pages/WorkshopDetailPage';
import NewRequestPage from './pages/NewRequestPage';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ServiceRequestHistory from './pages/ServiceRequestHistory';

// Components
import ProtectedRoute from './components/Auth/ProtectedRoute';
import RoleProtectedRoute from './components/Auth/RoleProtectedRoute';
import PublicRoute from './components/Auth/PublicRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public Routes - Only accessible when not authenticated */}
            <Route path="/login" element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } />
           
            <Route path="/signup" element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } />
            
            <Route path="/forgot-password" element={
              <PublicRoute>
                <ForgotPassword />
              </PublicRoute>
            } />
            
            <Route path="/reset-password" element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            } />

            {/* Email verification route - accessible for unverified users */}
            <Route path="/verify-email" element={<VerifyEmail />} />
            
            {/* Role selection route - accessible for verified users without roles */}
            <Route path="/select-role" element={<RoleSelection />} />

            {/* FIXED: Customer Dashboard Routes - Use END_USER instead of CUSTOMER */}
            <Route path="/dashboard" element={
              <RoleProtectedRoute allowedRoles={['END_USER']}>
                <Dashboard />
              </RoleProtectedRoute>
            } />
            
            <Route path="/request-service" element={
              <RoleProtectedRoute allowedRoles={['END_USER']}>
                <NewRequestPage />
              </RoleProtectedRoute>
            } />
            
            <Route path="/service-history" element={
              <RoleProtectedRoute allowedRoles={['END_USER']}>
                <ServiceRequestHistory />
              </RoleProtectedRoute>
            } />
            
            <Route path="/workshop/:id" element={
              <RoleProtectedRoute allowedRoles={['END_USER']}>
                <WorkshopDetailPage />
              </RoleProtectedRoute>
            } />

            {/* Mechanic Dashboard Routes */}
            <Route path="/worker-dashboard" element={
              <RoleProtectedRoute allowedRoles={['MECHANIC']}>
                <WorkerDashboard />
              </RoleProtectedRoute>
            } />

            {/* Admin Dashboard Routes */}
            <Route path="/admin-dashboard" element={
              <RoleProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </RoleProtectedRoute>
            } />

            {/* Default redirect based on user authentication */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
