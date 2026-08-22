import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';

const Layout = ({ children, title = 'Dashboard' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div
        className="main-content"
        style={{
          marginLeft: '0px',
        }}
      >
        <TopNavbar onToggleSidebar={() => setSidebarOpen(true)} title={title} />
        <main className="page-container">{children}</main>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .main-content {
            margin-left: 260px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
