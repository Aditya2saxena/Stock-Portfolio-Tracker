import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../api/watchlistService';
import Layout from '../components/layout/Layout';
import TransactionModal from '../components/modals/TransactionModal';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
  Star,
  PlusCircle,
  Trash2,
  TrendingUp,
  TrendingDown,
  Loader2,
  Eye,
  ArrowUpRight,
  ArrowUpDown,
} from 'lucide-react';
import { TableSkeleton } from '../components/common/LoadingSkeleton';

function Watchlist() {
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('symbol'); // 'symbol' | 'price' | 'change'

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSymbol, setModalSymbol] = useState('');
  const [modalPrice, setModalPrice] = useState('');

  const navigate = useNavigate();
  const { addToast } = useToast();

  const fetchWatchlistData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setError('');
      const res = await getWatchlist();
      setWatchlist(res.data || []);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
      setError('Failed to load watchlist');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWatchlistData(true);
  }, [fetchWatchlistData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    const stockSymbol = symbol.trim().toUpperCase();
    if (!stockSymbol) return;

    setError('');
    try {
      setSubmitting(true);
      await addToWatchlist({ stockSymbol });
      setSymbol('');
      addToast(`⭐ ${stockSymbol} added to watchlist`, 'success');
      await fetchWatchlistData();
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to add stock to watchlist';
      setError(errMsg);
      addToast(`❌ ${errMsg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (stockSymbol) => {
    try {
      await removeFromWatchlist(stockSymbol);
      addToast(`🗑 ${stockSymbol} removed from watchlist`, 'info');
      await fetchWatchlistData();
    } catch (err) {
      addToast('❌ Failed to remove stock', 'error');
    }
  };

  const handleOpenBuyModal = (stockSymbol, price) => {
    setModalSymbol(stockSymbol);
    setModalPrice(price);
    setIsModalOpen(true);
  };

  // Sorted watchlist items
  const sortedWatchlist = useMemo(() => {
    return [...watchlist].sort((a, b) => {
      if (sortBy === 'price') {
        return Number(b.currentPrice || 0) - Number(a.currentPrice || 0);
      }
      if (sortBy === 'change') {
        return Number(b.percentChange || 0) - Number(a.percentChange || 0);
      }
      // default: symbol
      return a.stockSymbol.localeCompare(b.stockSymbol);
    });
  }, [watchlist, sortBy]);

  return (
    <Layout title="Watchlist">
      {/* Header Banner */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Star size={24} color="#f59e0b" fill="#f59e0b" />
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            My Watchlist
          </h2>
        </div>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Monitor prices and daily change for stocks you are tracking.
        </p>
      </div>

      {/* Add Stock Card */}
      <div className="fintech-card" style={{ padding: '1.25rem', marginBottom: '1.75rem' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
          Add Stock to Watchlist
        </h3>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-negative-bg)',
              color: 'var(--color-negative)',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '0.75rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Stock Symbol (e.g. AAPL, TSLA)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            required
            className="form-input"
            style={{ flex: 1, minWidth: '200px' }}
          />
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? <Loader2 size={16} className="spin-loader" /> : <PlusCircle size={16} />}
            <span>Add Stock</span>
          </button>
        </form>
      </div>

      {/* Watchlist Table Card */}
      <div className="fintech-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
            Tracked Assets ({watchlist.length})
          </h3>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowUpDown size={14} color="var(--text-muted)" />
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)' }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-input"
              style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              <option value="symbol">Symbol (A-Z)</option>
              <option value="price">Highest Price</option>
              <option value="change">Highest % Change</option>
            </select>
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : sortedWatchlist.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-subtle)' }}>
            <Star size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              No stocks in watchlist
            </h4>
            <p style={{ fontSize: '0.85rem' }}>Add symbols above to track market movements.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="fintech-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Current Price</th>
                  <th>Change</th>
                  <th>% Change</th>
                  <th>Source</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedWatchlist.map((item) => {
                  const change = Number(item.change || 0);
                  const percentChange = Number(item.percentChange || 0);
                  const isPositive = change >= 0;

                  return (
                    <tr key={item._id}>
                      <td style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {item.stockSymbol}
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                        ₹{Number(item.currentPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span style={{ fontWeight: '700', color: isPositive ? 'var(--color-positive)' : 'var(--color-negative)' }}>
                          {isPositive ? '+₹' : '-₹'}
                          {Math.abs(change).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: isPositive ? 'var(--color-positive-bg)' : 'var(--color-negative-bg)',
                            color: isPositive ? 'var(--color-positive)' : 'var(--color-negative)',
                          }}
                        >
                          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                          {isPositive ? '+' : ''}
                          {percentChange.toFixed(2)}%
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${item.dataSource || 'live'}`}>
                          {item.dataSource || 'live'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                          <button
                            onClick={() => navigate(`/stock/${item.stockSymbol}`)}
                            style={{
                              backgroundColor: 'var(--bg-input)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-main)',
                              padding: '0.35rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                            title="View Stock Details"
                          >
                            <Eye size={14} />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => handleOpenBuyModal(item.stockSymbol, item.currentPrice)}
                            style={{
                              backgroundColor: 'var(--color-positive-bg)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              color: 'var(--color-positive)',
                              padding: '0.35rem 0.65rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                            }}
                            title="Buy Shares"
                          >
                            <ArrowUpRight size={14} />
                            <span>Buy</span>
                          </button>

                          <button
                            onClick={() => handleRemove(item.stockSymbol)}
                            className="btn-danger"
                            title="Remove from Watchlist"
                          >
                            <Trash2 size={14} />
                            <span>Remove</span>
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

      {/* Transaction Buy Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialSymbol={modalSymbol}
        initialPrice={modalPrice}
        initialType="BUY"
      />
    </Layout>
  );
}

export default Watchlist;