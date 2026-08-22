import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';

const CHART_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
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
        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-main)' }}>
          {data.name}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-accent)', marginTop: '0.15rem' }}>
          Value: ₹{Number(data.value).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Share: {data.payload.percentage}%
        </div>
      </div>
    );
  }
  return null;
};

const AllocationChart = ({ portfolio = [] }) => {
  const totalValue = portfolio.reduce((sum, item) => sum + Number(item.currentValue || 0), 0);

  const chartData = portfolio
    .filter((item) => Number(item.currentValue || 0) > 0)
    .map((item) => {
      const val = Number(item.currentValue || 0);
      const percentage = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : '0.0';
      return {
        name: item.stockSymbol,
        value: val,
        percentage,
      };
    });

  return (
    <div className="fintech-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <PieIcon size={18} color="var(--color-accent)" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
          Portfolio Allocation
        </h3>
      </div>

      {chartData.length > 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ width: '100%', height: 190 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="var(--bg-card)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Allocation Legend List */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '0.65rem',
              marginTop: '0.75rem',
              paddingTop: '0.75rem',
              borderTop: '1px solid var(--border-color)',
            }}
          >
            {chartData.map((item, idx) => (
              <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '3px',
                    backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{item.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: '600' }}>{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-subtle)',
            fontSize: '0.85rem',
          }}
        >
          No allocation data available
        </div>
      )}
    </div>
  );
};

export default AllocationChart;
