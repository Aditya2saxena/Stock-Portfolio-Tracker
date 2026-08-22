import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { TrendingUp, Clock } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 0.85rem',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.25rem' }}>
          Time: {label}
        </div>
        <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--color-accent)' }}>
          Portfolio Value: ₹{Number(payload[0].value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
      </div>
    );
  }
  return null;
};

const PortfolioChart = ({ valueHistory = [] }) => {
  const [activeRange, setActiveRange] = useState('1D');
  const ranges = ['1D', '1W', '1M', '3M', '6M', '1Y'];

  return (
    <div className="fintech-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="var(--color-accent)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              Portfolio Value Trend
            </h3>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Real-time snapshot history auto-saved to database
          </p>
        </div>

        {/* Time-Range Selector Buttons */}
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
          {ranges.map((range) => (
            <button
              key={range}
              onClick={() => setActiveRange(range)}
              style={{
                padding: '0.25rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: '600',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: activeRange === range ? 'var(--color-accent)' : 'transparent',
                color: activeRange === range ? '#ffffff' : 'var(--text-muted)',
                transition: 'all 0.15s ease',
              }}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Display */}
      {valueHistory.length > 0 ? (
        <div style={{ width: '100%', height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={valueHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="var(--text-subtle)"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: 'var(--border-color)' }}
              />
              <YAxis
                stroke="var(--text-subtle)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(1)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-accent)"
                strokeWidth={3}
                dot={{ r: 3, fill: 'var(--color-accent)', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: 'var(--color-accent)', stroke: 'var(--bg-card)', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div
          style={{
            height: 220,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: 'var(--text-subtle)',
            fontSize: '0.85rem',
          }}
        >
          <Clock size={28} />
          <span>Awaiting portfolio value history snapshots...</span>
        </div>
      )}
    </div>
  );
};

export default PortfolioChart;
