import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getNotifications, markAllAsRead, markAsRead } from '../../api/notificationService';
import StockSearch from '../common/StockSearch';
import socket from '../../socket';
import { Sun, Moon, Bell, Menu, CheckCheck } from 'lucide-react';

const TopNavbar = ({ onToggleSidebar, title = 'Dashboard' }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const dropdownRef = useRef(null);
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      if (res.data && res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Ignore notification fetch errors
    }
  };

  useEffect(() => {
    fetchNotifications();

    const handleNewAlert = () => {
      fetchNotifications();
    };

    socket.on('priceAlertTriggered', handleNewAlert);

    return () => {
      socket.off('priceAlertTriggered', handleNewAlert);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (e) {}
  };

  const handleMarkSingleRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (e) {}
  };

  return (
    <header
      style={{
        height: '70px',
        backgroundColor: 'var(--bg-card)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left section: Hamburger & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'transparent',
            color: 'var(--text-muted)',
            padding: '0.4rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          className="mobile-menu-btn"
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={22} />
        </button>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: '500' }}>
            Portfolio Tracker /
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, lineHeight: 1.2 }}>
            {title}
          </h1>
        </div>
      </div>

      {/* Right section: Search, Notifications Dropdown, Theme Toggle, User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Stock Search Component */}
        <div style={{ width: '220px' }} className="topbar-search">
          <StockSearch placeholder="Search symbol..." />
        </div>

        {/* Notifications Icon & Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              cursor: 'pointer',
            }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  backgroundColor: 'var(--color-accent)',
                  color: '#ffffff',
                  fontSize: '0.65rem',
                  fontWeight: '800',
                  borderRadius: 'var(--radius-full)',
                  padding: '0.15rem 0.4rem',
                  lineHeight: 1,
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '340px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 100,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '0.85rem 1rem',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--bg-card-hover)',
                }}
              >
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  Notifications ({unreadCount} unread)
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{
                      background: 'transparent',
                      color: 'var(--color-accent)',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <CheckCheck size={14} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => handleMarkSingleRead(item._id)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: item.isRead ? 'transparent' : 'var(--color-accent-light)',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      <div style={{ fontWeight: item.isRead ? '600' : '800', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem', lineHeight: '1.3' }}>
                        {item.message}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-subtle)', marginTop: '0.3rem' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#6366f1" />}
        </button>

        {/* User Profile */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            paddingLeft: '0.5rem',
            borderLeft: '1px solid var(--border-color)',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-accent-light)',
              color: 'var(--color-accent)',
              border: '1px solid var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '0.9rem',
            }}
          >
            {userInitial}
          </div>
          <div className="user-info-text">
            <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: 1.1 }}>
              {user?.name || 'Investor'}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Pro Trader</div>
          </div>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .mobile-menu-btn {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .topbar-search, .user-info-text {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};

export default TopNavbar;
