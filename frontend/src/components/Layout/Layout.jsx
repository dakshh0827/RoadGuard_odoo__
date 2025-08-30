// src/components/Layout/Layout.jsx - Updated with Role-Based Header
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import RoleBasedHeader from './RoleBasedHeader';

const Layout = ({ children, showHeader = true }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && user && user.role && <RoleBasedHeader />}
      <main className={showHeader && user && user.role ? '' : 'min-h-screen'}>
        {children}
      </main>
    </div>
  );
};

export default Layout;