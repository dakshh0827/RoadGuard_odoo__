// src/components/Layout/RoleBasedHeader.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRolePermissions } from '../../Hooks/useRolePermissions';
import Button from '../UI/Button';

const RoleBasedHeader = () => {
  const { user, logout } = useAuth();
  const { isAdmin, isCustomer, isMechanic } = useRolePermissions();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Navigation items based on role
  const getNavigationItems = () => {
    if (isAdmin()) {
      return [
        { label: 'Admin Dashboard', path: '/admin-dashboard' },
        { label: 'Manage Users', path: '/admin/users' },
        { label: 'Analytics', path: '/admin/analytics' },
        { label: 'Settings', path: '/admin/settings' }
      ];
    } else if (isMechanic()) {
      return [
        { label: 'Worker Dashboard', path: '/worker-dashboard' },
        { label: 'Service Requests', path: '/worker/requests' },
        { label: 'My Profile', path: '/worker/profile' },
        { label: 'Earnings', path: '/worker/earnings' }
      ];
    } else if (isCustomer()) {
      return [
        { label: 'Dashboard', path: '/dashboard' },
        { label: 'Request Service', path: '/request-service' },
        { label: 'Service History', path: '/service-history' },
        { label: 'My Profile', path: '/profile' }
      ];
    }
    return [];
  };

  const navigationItems = getNavigationItems();

  const getRoleBadge = () => {
    const roleColors = {
      ADMIN: 'bg-purple-100 text-purple-800',
      MECHANIC: 'bg-blue-100 text-blue-800',
      CUSTOMER: 'bg-green-100 text-green-800'
    };

    const roleLabels = {
      ADMIN: 'Admin',
      MECHANIC: 'Mechanic',
      CUSTOMER: 'Customer'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[user?.role] || 'bg-gray-100 text-gray-800'}`}>
        {roleLabels[user?.role] || 'User'}
      </span>
    );
  };

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to={user?.role ? navigationItems[0]?.path || '/dashboard' : '/dashboard'} className="text-xl font-bold text-gray-900">
              RoadGuard
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            
              <Link
                key={'/service-history'}
                to={'/service-history'}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {'Service History'}
              </Link>
          
          </nav>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {/* Role Badge */}
            {user?.role && getRoleBadge()}
            
            {/* User Info */}
            <div className="hidden md:flex items-center space-x-3">
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="block px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="px-3 py-2 text-sm text-gray-700">
                  {user?.firstName} {user?.lastName}
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default RoleBasedHeader;