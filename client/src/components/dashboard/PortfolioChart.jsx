import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { TrendingUp, Clock } from 'lucide-react';
import { getCurrencySymbol } from '../../utils/portfolioTotals';

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.25rem' }}>Time: {label}</div>
      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-accent)' }}>
        {currency} portfolio value: {getCurrencySymbol(currency)}{Number(payload[0].value).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2 })}
      </div>
    </div>
  );
};

const PortfolioChart = ({ valueHistory = [] }) => {
  const [activeRange, setActiveRange] = useState('1D');
  const ranges = ['1D', '1W', '1M', '3M', '6M', '1Y'];
  const currencies = Array.from(new Set(valueHistory.flatMap((point) => Object.keys(point.totalsByCurrency || {}))));

  return (
    <div className="fintech-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="var(--color-accent)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Portfolio Value Trend</h3>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Currency totals are charted separately</p>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg-input)', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          {ranges.map((range) => <button key={range} onClick={() => setActiveRange(range)} style={{ padding: '0.25rem 0.65rem', fontSize: '0.75rem', fontWeight: 600, borderRadius: 'var(--radius-sm)', backgroundColor: activeRange === range ? 'var(--color-accent)' : 'transparent', color: activeRange === range ? '#fff' : 'var(--text-muted)' }}>{range}</button>)}
        </div>
      </div>
      {currencies.length ? (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`, gap: '1rem' }}>
          {currencies.map((currency) => (
            <div key={currency}>
              <strong style={{ color: 'var(--text-main)' }}>{currency}</strong>
              <div style={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={valueHistory.filter((point) => Number.isFinite(Number(point.totalsByCurrency?.[currency])))} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="time" stroke="var(--text-subtle)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-subtle)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `${getCurrencySymbol(currency)}${(value / 1000).toFixed(1)}k`} />
                    <Tooltip content={(props) => <CustomTooltip {...props} currency={currency} />} />
                    <Line type="monotone" dataKey={`totalsByCurrency.${currency}`} name={currency} stroke="var(--color-accent)" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ height: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
          <Clock size={28} /><span>Awaiting portfolio value history snapshots...</span>
        </div>
      )}
    </div>
  );
};

export default PortfolioChart;
