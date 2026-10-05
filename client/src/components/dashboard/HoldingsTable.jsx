import React from 'react';
import { Trash2, TrendingUp, TrendingDown, Layers } from 'lucide-react';

const HoldingsTable = ({ portfolio = [], onDelete, loading, showAllocation = false }) => {
  const totalCurrentValue = portfolio.reduce(
    (total, item) => total + Number(item.currentValue || 0),
    0
  );
  const getBadgeClass = (source) => {
    switch (source) {
      case 'live':
        return 'badge-live';
      case 'cached':
        return 'badge-cached';
      case 'demo':
        return 'badge-demo';
      case 'unavailable':
      default:
        return 'badge-unavailable';
    }
  };

  const getSourceIcon = (source) => {
    switch (source) {
      case 'live':
        return '🟢';
      case 'cached':
        return '🟡';
      case 'demo':
        return '🟠';
      case 'unavailable':
      default:
        return '🔴';
    }
  };

  const getCurrencySymbol = (item) => {
    if (item.currency === 'INR' || item.stockSymbol?.endsWith('.NS')) return '₹';
    if (item.currency === 'USD') return '$';
    return item.currency === 'INR' ? '₹' : '$';
  };

  return (
    <div className="fintech-card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} color="var(--color-accent)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
            Portfolio Holdings
          </h3>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500' }}>
          {portfolio.length} {portfolio.length === 1 ? 'Asset' : 'Assets'}
        </span>
      </div>

      <div className="table-responsive">
        <table className="fintech-table">
          <thead>
            <tr>
              <th>Stock</th>
              <th>Quantity</th>
              <th>Avg. Buy Price</th>
              <th>Current Price</th>
              <th>Invested</th>
              <th>Current Value</th>
              <th>P/L</th>
              <th>Return</th>
              {showAllocation && <th>Allocation</th>}
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.map((item) => {
              const currSym = getCurrencySymbol(item);
              const buyPrice = Number(item.buyPrice || 0);
              const currentPrice = item.currentPrice !== null && item.currentPrice !== undefined ? Number(item.currentPrice) : null;
              const quantity = Number(item.quantity || 0);
              const investment = item.investment ? Number(item.investment) : buyPrice * quantity;
              const currentValue = currentPrice !== null ? currentPrice * quantity : 0;
              const profitLoss = currentPrice !== null ? currentValue - investment : 0;
              const percentageReturn = item.percentageReturn !== undefined ? item.percentageReturn : (investment > 0 ? ((profitLoss / investment) * 100).toFixed(2) : '0.00');

              const isPositive = Number(profitLoss) >= 0;
              const allocation = totalCurrentValue > 0 ? (currentValue / totalCurrentValue) * 100 : 0;

              return (
                <tr key={item._id}>
                  {/* Stock Symbol + Badge */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {item.stockSymbol}
                      </span>
                      <span className={`badge ${getBadgeClass(item.dataSource)}`}>
                        <span>{getSourceIcon(item.dataSource)}</span>
                        <span>{item.dataSource || 'live'}</span>
                      </span>
                    </div>
                    {item.name && item.name !== item.stockSymbol && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.name}</div>
                    )}
                  </td>

                  {/* Quantity */}
                  <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>{quantity}</td>

                  {/* Avg Buy Price */}
                  <td style={{ color: 'var(--text-muted)' }}>
                    {currSym}{buyPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Current Price */}
                  <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                    {currentPrice !== null
                      ? `${currSym}${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : 'N/A'}
                  </td>

                  {/* Invested */}
                  <td style={{ color: 'var(--text-muted)' }}>
                    {currSym}{investment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* Current Value */}
                  <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                    {currSym}{currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>

                  {/* P/L */}
                  <td>
                    <span
                      style={{
                        fontWeight: '700',
                        color: isPositive ? 'var(--color-positive)' : 'var(--color-negative)',
                      }}
                    >
                      {isPositive ? `+${currSym}` : `-${currSym}`}
                      {Math.abs(profitLoss).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </td>

                  {/* Return % */}
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
                      {percentageReturn}%
                    </span>
                  </td>

                  {showAllocation && (
                    <td style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                      {allocation.toFixed(2)}%
                    </td>
                  )}

                  {/* Delete Action */}
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => onDelete(item._id, item.stockSymbol)}
                      className="btn-danger"
                      title="Remove stock from portfolio"
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
    </div>
  );
};

export default HoldingsTable;
