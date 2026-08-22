import React from 'react';
import { History, ArrowUpRight, ArrowDownRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const RecentTransactions = ({ transactions = [] }) => {
  return (
    <div className="fintech-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <History size={18} color="var(--color-accent)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
            Recent Transactions
          </h3>
        </div>
        <Link
          to="/transactions"
          style={{
            fontSize: '0.8rem',
            color: 'var(--color-accent)',
            fontWeight: '600',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <span>View All</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem 0',
            color: 'var(--text-subtle)',
            fontSize: '0.85rem',
          }}
        >
          <span>No recent transactions executed yet</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {transactions.slice(0, 5).map((item) => {
            const isBuy = item.type === 'BUY';
            const Icon = isBuy ? ArrowUpRight : ArrowDownRight;
            const badgeColor = isBuy ? 'var(--color-positive)' : 'var(--color-negative)';
            const bgColor = isBuy ? 'var(--color-positive-bg)' : 'var(--color-negative-bg)';
            const timeAgo = item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

            return (
              <div
                key={item._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: bgColor,
                      color: badgeColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        {item.stockSymbol}
                      </span>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: bgColor,
                          color: badgeColor,
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.4rem',
                        }}
                      >
                        {item.type}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {item.quantity} {item.quantity === 1 ? 'share' : 'shares'} @ ₹{Number(item.price).toFixed(2)}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', color: isBuy ? 'var(--color-positive)' : 'var(--color-negative)' }}>
                    {isBuy ? '+' : '-'}₹{Number(item.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '0.1rem' }}>
                    {timeAgo}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
