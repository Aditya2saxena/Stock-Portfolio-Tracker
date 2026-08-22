import React from 'react';
import { Trophy, TrendingDown } from 'lucide-react';

const PerformerCard = ({ title, performer, type = 'best' }) => {
  const isBest = type === 'best';
  const Icon = isBest ? Trophy : TrendingDown;
  const badgeColor = isBest ? 'var(--color-positive)' : 'var(--color-negative)';
  const bgColor = isBest ? 'var(--color-positive-bg)' : 'var(--color-negative-bg)';

  return (
    <div className="fintech-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon size={18} color={badgeColor} />
          <span style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--text-main)' }}>{title}</span>
        </div>
        <span
          className="badge"
          style={{
            backgroundColor: bgColor,
            color: badgeColor,
            fontSize: '0.7rem',
          }}
        >
          {isBest ? 'Top Gain' : 'Top Loss'}
        </span>
      </div>

      {performer ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)' }}>
              {performer.stockSymbol}
            </span>
            <span style={{ fontSize: '0.95rem', fontWeight: '700', color: badgeColor }}>
              {Number(performer.percentageReturn) >= 0 ? '+' : ''}
              {Number(performer.percentageReturn).toFixed(2)}%
            </span>
          </div>

          <div style={{ marginTop: '0.35rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
            P/L:{' '}
            <span style={{ color: badgeColor, fontWeight: '700' }}>
              {Number(performer.profitLoss) >= 0 ? '+₹' : '-₹'}
              {Math.abs(Number(performer.profitLoss || 0)).toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ padding: '0.5rem 0', color: 'var(--text-subtle)', fontSize: '0.85rem', fontStyle: 'italic' }}>
          No performance data available yet.
        </div>
      )}
    </div>
  );
};

export default PerformerCard;
