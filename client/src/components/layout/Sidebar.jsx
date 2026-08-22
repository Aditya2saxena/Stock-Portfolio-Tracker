import React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  LayoutDashboard,
  Briefcase,
  Star,
  BarChart3,
  Receipt,
  Bell,
  Settings,
  LogOut,
  X,
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      active: location.pathname === '/dashboard',
    },
    {
      name: 'Portfolio',
      path: '/dashboard',
      icon: Briefcase,
      active: false,
    },
    {
      name: 'Watchlist',
      path: '/watchlist',
      icon: Star,
      active: location.pathname === '/watchlist',
    },
    {
      name: 'Transactions',
      path: '/transactions',
      icon: Receipt,
      active: location.pathname === '/transactions',
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: BarChart3,
      active: location.pathname === '/analytics',
    },
    {
      name: 'Alerts',
      path: '/alerts',
      icon: Bell,
      active: location.pathname === '/alerts',
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 40,
            display: 'block',
          }}
          className="sidebar-backdrop"
        />
      )}

      {/* Sidebar Container */}
      <aside
        style={{
          width: '260px',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.25rem 1rem',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 50,
          transition: 'transform 0.3s ease',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
        className="sidebar-container"
      >
        <div>
          {/* Brand Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '1.25rem',
              marginBottom: '1rem',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            <Link
              to="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                textDecoration: 'none',
                color: 'var(--text-main)',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--color-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 10px rgba(99, 102, 241, 0.3)',
                }}
              >
                <TrendingUp size={20} />
              </div>
              <span
                style={{
                  fontSize: '1.2rem',
                  fontWeight: '800',
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, var(--text-main) 30%, var(--color-accent))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                StockTracker
              </span>
            </Link>

            {/* Close button for mobile */}
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                color: 'var(--text-muted)',
                padding: '4px',
                borderRadius: '6px',
                display: 'none',
              }}
              className="sidebar-close-btn"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    color: item.active ? 'var(--color-accent)' : 'var(--text-muted)',
                    backgroundColor: item.active ? 'var(--color-accent-light)' : 'transparent',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: item.active ? '700' : '500',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Icon size={18} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}
        >
          {/* Settings Link */}
          <Link
            to="/settings"
            onClick={() => {
              if (window.innerWidth < 1024) onClose();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              color: location.pathname === '/settings' ? 'var(--color-accent)' : 'var(--text-muted)',
              backgroundColor: location.pathname === '/settings' ? 'var(--color-accent-light)' : 'transparent',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: location.pathname === '/settings' ? '700' : '500',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Settings size={18} />
              <span>Settings</span>
            </div>
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              color: 'var(--color-negative)',
              backgroundColor: 'transparent',
              fontSize: '0.9rem',
              fontWeight: '600',
              textAlign: 'left',
            }}
            className="sidebar-logout-btn"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Desktop Persistent Sidebar CSS Override */}
      <style>{`
        @media (min-width: 1024px) {
          .sidebar-container {
            transform: translateX(0) !important;
          }
          .sidebar-backdrop {
            display: none !important;
          }
        }
        @media (max-width: 1023px) {
          .sidebar-close-btn {
            display: block !important;
          }
        }
        .sidebar-logout-btn:hover {
          background-color: var(--color-negative-bg) !important;
        }
      `}</style>
    </>
  );
};

export default Sidebar;
