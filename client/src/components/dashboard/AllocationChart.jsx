import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import { getCurrencySymbol } from '../../utils/portfolioTotals';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#3b82f6'];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.65rem 0.85rem' }}>
    <strong>{item.name}</strong><div>{getCurrencySymbol(item.currency)}{Number(item.value).toLocaleString(item.currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2 })}</div>
    <small>Share of {item.currency} holdings: {item.percentage}%</small>
  </div>;
};

const AllocationChart = ({ portfolio = [] }) => {
  const currencies = Array.from(new Set(portfolio.map((item) => item.currency || (item.stockSymbol?.endsWith('.NS') ? 'INR' : 'USD'))));
  const datasets = currencies.map((currency) => {
    const holdings = portfolio.filter((item) => (item.currency || (item.stockSymbol?.endsWith('.NS') ? 'INR' : 'USD')) === currency && Number(item.currentValue) > 0);
    const total = holdings.reduce((sum, item) => sum + Number(item.currentValue), 0);
    return { currency, items: holdings.map((item) => ({
      name: item.stockSymbol,
      currency,
      value: Number(item.currentValue),
      percentage: total ? (Number(item.currentValue) / total * 100).toFixed(1) : '0.0',
    })) };
  }).filter((group) => group.items.length);

  return <div className="fintech-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
      <PieIcon size={18} color="var(--color-accent)" />
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Portfolio Allocation by Currency</h3>
    </div>
    {datasets.length ? <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '1rem' }}>
      {datasets.map(({ currency, items }) => <section key={currency}>
        <strong>{currency}</strong>
        <div style={{ width: '100%', height: 190 }}><ResponsiveContainer width="100%" height="100%"><PieChart>
          <Pie data={items} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3}>
            {items.map((item, index) => <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="var(--bg-card)" strokeWidth={2} />)}
          </Pie><Tooltip content={<CustomTooltip />} />
        </PieChart></ResponsiveContainer></div>
        <div style={{ display: 'grid', gap: '0.45rem' }}>{items.map((item, index) => <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
          <span style={{ color: CHART_COLORS[index % CHART_COLORS.length], fontWeight: 700 }}>{item.name}</span><span>{item.percentage}%</span>
        </div>)}</div>
      </section>)}
    </div> : <div style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'var(--text-subtle)', fontSize: '0.85rem' }}>No allocation data available</div>}
  </div>;
};

export default AllocationChart;
