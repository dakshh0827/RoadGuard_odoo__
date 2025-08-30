import React from 'react';
import Header from './Header';

const Layout = ({ children, showHeader = true }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {showHeader && <Header />}
      <main className={`${showHeader ? 'pt-0' : ''} flex-1`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;