import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { getTransactions, deleteTransaction } from '../api/transactionService';
import Layout from '../components/layout/Layout';
import { useToast } from '../context/ToastContext';
import { TableSkeleton } from '../components/common/LoadingSkeleton';
import {
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Filter,
  Search,
  CheckCircle2,
} from 'lucide-react';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [searchSymbol, setSearchSymbol] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { addToast } = useToast();

  const fetchTransactionsList = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setError('');
      const params = {};
      if (filterType !== 'ALL') params.type = filterType;
      if (searchSymbol.trim()) params.stockSymbol = searchSymbol.trim();

      const res = await getTransactions(params);
      setTransactions(res.data || []);
    } catch (err) {
      console.error('Failed to load transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [filterType, searchSymbol]);

  useEffect(() => {
    fetchTransactionsList(true);
  }, [fetchTransactionsList]);

  const handleDelete = async (id, symbol) => {
    try {
      await deleteTransaction(id);
      addToast(`🗑 Transaction record for ${symbol} deleted`, 'info');
      await fetchTransactionsList();
    } catch (err) {
      addToast('❌ Failed to delete transaction', 'error');
    }
  };

  // Transaction Summaries
  const { totalBuyVolume, totalSellVolume } = useMemo(() => {
    let buySum = 0;
    let sellSum = 0;
    transactions.forEach((tx) => {
      const amt = Number(tx.totalAmount || 0);
      if (tx.type === 'BUY') buySum += amt;
      else if (tx.type === 'SELL') sellSum += amt;
    });
    return { totalBuyVolume: buySum, totalSellVolume: sellSum };
  }, [transactions]);

  return (
    <Layout title="Transactions">
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Receipt size={26} color="var(--color-accent)" />
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Transaction History
          </h2>
        </div>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Complete record of your executed BUY and SELL stock orders.
        </p>
      </div>

      {/* Summary Volume Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        <div className="fintech-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total Orders</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.2rem' }}>
            {transactions.length}
          </div>
        </div>

        <div className="fintech-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total BUY Volume</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-positive)', marginTop: '0.2rem' }}>
            ₹{totalBuyVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="fintech-card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Total SELL Volume</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-negative)', marginTop: '0.2rem' }}>
            ₹{totalSellVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Filter Tabs & Table Card */}
      <div className="fintech-card" style={{ padding: '1.25rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          {/* Symbol Search Filter */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
            <input
              type="text"
              placeholder="Filter by symbol..."
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '2.2rem', height: '36px', fontSize: '0.85rem' }}
            />
          </div>

          {/* Filter Tab Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--text-muted)" />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                backgroundColor: 'var(--bg-input)',
                padding: '0.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
              }}
            >
              {['ALL', 'BUY', 'SELL'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: filterType === type ? 'var(--color-accent)' : 'transparent',
                    color: filterType === type ? '#ffffff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

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

        {/* Transactions Table */}
        {loading ? (
          <TableSkeleton />
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-subtle)' }}>
            <Receipt size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
            <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              No transactions found
            </h4>
            <p style={{ fontSize: '0.85rem' }}>
              {filterType === 'ALL' && !searchSymbol
                ? 'Execute your first BUY or SELL order to see history here.'
                : 'No orders match your filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="fintech-table">
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Stock</th>
                  <th>Type</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isBuy = tx.type === 'BUY';
                  const Icon = isBuy ? ArrowUpRight : ArrowDownRight;
                  const dateStr = tx.createdAt ? new Date(tx.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A';

                  return (
                    <tr key={tx._id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{dateStr}</td>
                      <td>
                        <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          {tx.stockSymbol}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: isBuy ? 'var(--color-positive-bg)' : 'var(--color-negative-bg)',
                            color: isBuy ? 'var(--color-positive)' : 'var(--color-negative)',
                            fontWeight: '700',
                          }}
                        >
                          <Icon size={12} />
                          {tx.type}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{tx.quantity}</td>
                      <td style={{ color: 'var(--text-main)' }}>
                        ₹{Number(tx.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ fontWeight: '800', color: isBuy ? 'var(--color-positive)' : 'var(--color-negative)' }}>
                        {isBuy ? '+' : '-'}₹{Number(tx.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <span className="badge badge-live">
                          <CheckCircle2 size={12} color="#22c55e" />
                          Executed
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleDelete(tx._id, tx.stockSymbol)}
                          className="btn-danger"
                          title="Delete transaction log"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
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

export default Transactions;
