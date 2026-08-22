import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const SummaryCard = ({ title, value, isCurrency = true, isProfitLoss = false, percentChange = null, icon: Icon, isPositive = true }) => {
  const formattedValue = isCurrency
    ? `₹${Math.abs(Number(value || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${Number(value || 0) >= 0 ? '+' : ''}${Number(value || 0).toFixed(2)}%`;

  const displayPrefix = isProfitLoss ? (Number(value || 0) >= 0 ? '+₹' : '-₹') : (isCurrency ? '₹' : '');
  const displayVal = isProfitLoss
    ? Math.abs(Number(value || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : (isCurrency ? Math.abs(Number(value || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : formattedValue);

  return (
    <div className="fintech-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>{title}</span>
        {Icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-input)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={18} />
          </div>
        )}
      </div>

      <div>
        <div
          style={{
            fontSize: '1.5rem',
            fontWeight: '800',
            color: isProfitLoss || !isCurrency ? (isPositive ? 'var(--color-positive)' : 'var(--color-negative)') : 'var(--text-main)',
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          {isProfitLoss ? displayPrefix + displayVal : (isCurrency ? displayPrefix + displayVal : displayVal)}
        </div>

        {percentChange !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.4rem' }}>
            <span
              className="badge"
              style={{
                backgroundColor: isPositive ? 'var(--color-positive-bg)' : 'var(--color-negative-bg)',
                color: isPositive ? 'var(--color-positive)' : 'var(--color-negative)',
                padding: '0.15rem 0.5rem',
                fontSize: '0.75rem',
              }}
            >
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {isPositive ? '+' : ''}{Number(percentChange).toFixed(2)}%
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>overall</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
