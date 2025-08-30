// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import WorkshopDetailPage from './pages/WorkshopDetailPage';
import NewRequestPage from './pages/NewRequestPage';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ServiceRequestHistory from './pages/ServiceRequestHistory';

// Components
import ProtectedRoute from './components/Auth/ProtectedRoute';
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

            {/* Protected Routes - Only accessible when authenticated and verified */}
            <Route path="/dashboard" element={
              // <ProtectedRoute>
                <Dashboard />
              // {/* </ProtectedRoute> */}
            } />

            <Route path="/worker-dashboard" element={
              // <ProtectedRoute>
                <WorkerDashboard />
              // </ProtectedRoute>
            } />

            <Route path="/admin-dashboard" element={
              // <ProtectedRoute>
                <AdminDashboard />
              // </ProtectedRoute>
            } /> 

            {/* <Route path="/service-history" element={
              <ProtectedRoute>
                <ServiceRequestHistory />
              </ProtectedRoute>
            } />

            <Route path="/workshop/:id" element={
              <ProtectedRoute>
                <WorkshopDetailPage />
              </ProtectedRoute>
            } />

            {/* <-- ADD THIS NEW ROUTE FOR THE SERVICE REQUEST PAGE --> */}
            <Route path="/request-service" element={
              // <ProtectedRoute>
                <NewRequestPage />
              // {/* </ProtectedRoute> */}
            } />

            {/* Default redirect */}
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