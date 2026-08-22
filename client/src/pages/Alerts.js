import React, { useState, useEffect, useCallback } from 'react';
import {
  getAlerts,
  createAlert,
  toggleAlert,
  deleteAlert,
} from '../api/alertService';
import Layout from '../components/layout/Layout';
import { useToast } from '../context/ToastContext';
import socket from '../socket';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import {
  Bell,
  PlusCircle,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState('ABOVE');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { addToast } = useToast();

  const fetchAlertsList = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setError('');
      const res = await getAlerts();
      setAlerts(res.data || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
      setError('Failed to load price alerts');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlertsList(true);
    // Request browser notification permission if available
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, [fetchAlertsList]);

  // Listen to Socket.io alert trigger events
  useEffect(() => {
    const handleAlertTriggered = (data) => {
      addToast(`🔔 ALERT: ${data.message}`, 'info');

      // Native browser notification if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(data.title, { body: data.message });
        } catch (e) {}
      }

      fetchAlertsList();
    };

    socket.on('priceAlertTriggered', handleAlertTriggered);

    return () => {
      socket.off('priceAlertTriggered', handleAlertTriggered);
    };
  }, [addToast, fetchAlertsList]);

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    const stockSymbol = symbol.trim().toUpperCase();
    const target = Number(targetPrice);

    if (!stockSymbol) {
      setError('Please enter a stock symbol');
      return;
    }
    if (isNaN(target) || target <= 0) {
      setError('Target price must be greater than 0');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await createAlert({
        stockSymbol,
        targetPrice: target,
        condition,
      });

      setSymbol('');
      setTargetPrice('');
      addToast(`🔔 Alert created for ${stockSymbol} ${condition} ₹${target}`, 'success');
      await fetchAlertsList();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to create price alert';
      setError(errMsg);
      addToast(`❌ ${errMsg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleAlert(id);
      await fetchAlertsList();
    } catch (err) {
      addToast('❌ Failed to toggle alert status', 'error');
    }
  };

  const handleDelete = async (id, stockSymbol) => {
    try {
      await deleteAlert(id);
      addToast(`🗑 Alert for ${stockSymbol} removed`, 'info');
      await fetchAlertsList();
    } catch (err) {
      addToast('❌ Failed to delete alert', 'error');
    }
  };

  return (
    <Layout title="Alerts">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Bell size={26} color="var(--color-accent)" />
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Price Alerts
          </h2>
        </div>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Set automated target price triggers to get notified when stock prices cross specified levels.
        </p>
      </div>

      {/* Create Alert Card */}
      <div className="fintech-card" style={{ padding: '1.5rem', marginBottom: '1.75rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '1rem' }}>
          Create New Price Alert
        </h3>

        {error && (
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
            {error}
          </div>
        )}

        <form onSubmit={handleCreateAlert}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Stock Symbol
              </label>
              <input
                type="text"
                placeholder="e.g. MSFT, AAPL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                required
                className="form-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Trigger Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="form-input"
                style={{ cursor: 'pointer' }}
              >
                <option value="ABOVE">Above Target Price (&gt;=)</option>
                <option value="BELOW">Below Target Price (&lt;=)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Target Price (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 450.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                required
                min="0.01"
                step="0.01"
                className="form-input"
              />
            </div>

            <div>
              <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%', height: '42px' }}>
                {submitting ? <Loader2 size={18} className="spin-loader" /> : <PlusCircle size={18} />}
                <span>Create Alert</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Active & Triggered Alerts Table */}
      <div className="fintech-card" style={{ padding: '1.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '1.25rem' }}>
          Your Price Alerts ({alerts.length})
        </h3>

        {loading ? (
          <TableSkeleton />
        ) : alerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-subtle)' }}>
            <Bell size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              No price alerts set yet
            </h4>
            <p style={{ fontSize: '0.85rem' }}>Set target alerts above to get notified instantly on price movements.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="fintech-table">
              <thead>
                <tr>
                  <th>Stock</th>
                  <th>Condition</th>
                  <th>Target Price</th>
                  <th>Current Price</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((item) => {
                  const isAbove = item.condition === 'ABOVE';

                  return (
                    <tr key={item._id}>
                      <td style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {item.stockSymbol}
                      </td>

                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: isAbove ? 'var(--color-positive-bg)' : 'var(--color-negative-bg)',
                            color: isAbove ? 'var(--color-positive)' : 'var(--color-negative)',
                            fontWeight: '700',
                          }}
                        >
                          {isAbove ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                          {isAbove ? 'Above' : 'Below'}
                        </span>
                      </td>

                      <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                        ₹{Number(item.targetPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>

                      <td style={{ color: 'var(--text-muted)' }}>
                        {item.currentPrice !== null && item.currentPrice !== undefined
                          ? `₹${Number(item.currentPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                          : 'N/A'}
                      </td>

                      <td>
                        {item.isActive ? (
                          <span className="badge badge-live">🟢 Active</span>
                        ) : (
                          <span className="badge badge-demo" style={{ backgroundColor: 'var(--bg-input)' }}>
                            <CheckCircle2 size={12} color="#f59e0b" />
                            Triggered
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleToggle(item._id)}
                            style={{
                              background: 'transparent',
                              color: item.isActive ? 'var(--color-positive)' : 'var(--text-muted)',
                              padding: '2px',
                            }}
                            title={item.isActive ? 'Deactivate Alert' : 'Activate Alert'}
                          >
                            {item.isActive ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                          </button>

                          <button
                            onClick={() => handleDelete(item._id, item.stockSymbol)}
                            className="btn-danger"
                            title="Delete Alert"
                          >
                            <Trash2 size={14} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Alerts;
