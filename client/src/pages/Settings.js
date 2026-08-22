import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import API from '../api/axios';
import Layout from '../components/layout/Layout';
import {
  Settings as SettingsIcon,
  User,
  Sun,
  Moon,
  Bell,
  DollarSign,
  LogOut,
  Info,
  Shield,
  Check,
  KeyRound,
  Loader2,
} from 'lucide-react';

function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Price Alert Toast Preference
  const [priceAlertsEnabled, setPriceAlertsEnabled] = useState(() => {
    return localStorage.getItem('pref_price_alerts') !== 'false';
  });

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleToggleAlertPref = () => {
    const nextVal = !priceAlertsEnabled;
    setPriceAlertsEnabled(nextVal);
    localStorage.setItem('pref_price_alerts', String(nextVal));
    addToast(
      `Notifications ${nextVal ? 'enabled' : 'disabled'} for price alerts`,
      'info'
    );
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All password fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      setSubmittingPassword(true);
      const res = await API.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      addToast(`🔑 ${res.data.message || 'Password changed successfully'}`, 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to change password';
      setPasswordError(errMsg);
      addToast(`❌ ${errMsg}`, 'error');
    } finally {
      setSubmittingPassword(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout title="Settings">
      {/* Header Banner */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <SettingsIcon size={26} color="var(--color-accent)" />
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Settings
          </h2>
        </div>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Manage your account, security, appearance, and application preferences.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
        {/* Section 1: Account Profile */}
        <div className="fintech-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <User size={20} color="var(--color-accent)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              Account Profile
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-input)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Full Name</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                {user?.name || 'Investor User'}
              </div>
            </div>

            <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-input)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Email Address</div>
              <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                {user?.email || 'user@example.com'}
              </div>
            </div>

            <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-input)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Account Status</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                <span className="badge badge-live">Verified Pro User</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Appearance */}
        <div className="fintech-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {theme === 'dark' ? <Moon size={20} color="#6366f1" /> : <Sun size={20} color="#f59e0b" />}
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              Appearance
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
                Application Theme
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Currently active: <strong style={{ color: 'var(--color-accent)', textTransform: 'capitalize' }}>{theme} mode</strong>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: 'var(--bg-input)',
                padding: '0.3rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              <button
                onClick={() => {
                  if (theme !== 'dark') toggleTheme();
                }}
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: theme === 'dark' ? 'var(--color-accent)' : 'transparent',
                  color: theme === 'dark' ? '#ffffff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <Moon size={16} />
                <span>Dark</span>
              </button>

              <button
                onClick={() => {
                  if (theme !== 'light') toggleTheme();
                }}
                style={{
                  padding: '0.45rem 1rem',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: theme === 'light' ? 'var(--color-accent)' : 'transparent',
                  color: theme === 'light' ? '#ffffff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <Sun size={16} />
                <span>Light</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Change Password Security */}
        <div className="fintech-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <KeyRound size={20} color="var(--color-accent)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              Security — Change Password
            </h3>
          </div>

          {passwordError && (
            <div
              style={{
                backgroundColor: 'var(--color-negative-bg)',
                color: 'var(--color-negative)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}
            >
              {passwordError}
            </div>
          )}

          <form onSubmit={handleChangePassword}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" disabled={submittingPassword} style={{ height: '42px' }}>
                {submittingPassword ? <Loader2 size={16} className="spin-loader" /> : <KeyRound size={16} />}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>

        {/* Section 4: Notifications */}
        <div className="fintech-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Bell size={20} color="var(--color-accent)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              Notification Preferences
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
                Price Alert Toast Notifications
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Show toast alerts when target stock price thresholds trigger
              </div>
            </div>

            <button
              onClick={handleToggleAlertPref}
              className={priceAlertsEnabled ? 'btn-primary' : 'btn-danger'}
              style={{
                padding: '0.45rem 1rem',
                fontSize: '0.85rem',
                fontWeight: '700',
              }}
            >
              {priceAlertsEnabled ? (
                <>
                  <Check size={16} />
                  <span>ON</span>
                </>
              ) : (
                <span>OFF</span>
              )}
            </button>
          </div>
        </div>

        {/* Section 5: Currency Preference */}
        <div className="fintech-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <DollarSign size={20} color="var(--color-accent)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              Regional & Currency
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
                Primary Portfolio Currency
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                All values across Dashboard and Holdings are formatted in Indian Rupee
              </div>
            </div>

            <span className="badge badge-live" style={{ fontSize: '0.9rem', padding: '0.4rem 0.85rem' }}>
              ₹ INR (Indian Rupee)
            </span>
          </div>
        </div>

        {/* Section 6: Security & Session */}
        <div className="fintech-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Shield size={20} color="var(--color-accent)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              Session Control
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>
                Session Control
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                Securely sign out of your StockTracker account session
              </div>
            </div>

            <button onClick={handleLogout} className="btn-danger" style={{ padding: '0.55rem 1.1rem' }}>
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Section 7: About */}
        <div className="fintech-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Info size={20} color="var(--color-accent)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              About StockTracker
            </h3>
          </div>

          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '0.75rem' }}>
            Real-time stock portfolio management platform built with React, Node/Express, MongoDB, and Socket.io.
          </p>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontWeight: '600' }}>
            Version 0.1.0 • Stable Release
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Settings;
