import React, { useState, useEffect, useMemo } from 'react';
import { getPortfolio, getSnapshotHistory } from '../api/portfolioService';
import Layout from '../components/layout/Layout';
import SummaryCard from '../components/dashboard/SummaryCard';
import { TableSkeleton, ChartSkeleton } from '../components/common/LoadingSkeleton';
import EmptyState from '../components/common/EmptyState';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  ShieldAlert,
  Lightbulb,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { getPortfolioTotalsByCurrency, getCurrencySymbol } from '../utils/portfolioTotals';

function Analytics() {
  const [portfolio, setPortfolio] = useState([]);
  const [valueHistory, setValueHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState('1D');
  const [error, setError] = useState('');
  const snapshotCurrencies = Array.from(new Set(valueHistory.flatMap((point) => Object.keys(point.totalsByCurrency || {}))));

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        const [portfolioRes, historyRes] = await Promise.all([
          getPortfolio(),
          getSnapshotHistory(),
        ]);
        setPortfolio(portfolioRes.data || []);
        setValueHistory(historyRes.data || []);
      } catch (err) {
        console.error('Failed to load analytics data:', err);
        setError('Failed to load portfolio analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Performance calculations
  const currencyTotals = useMemo(() => getPortfolioTotalsByCurrency(portfolio), [portfolio]);
  const overallReturnPercent = useMemo(() => {
    return Object.fromEntries(Object.entries(currencyTotals).filter(([, item]) => item.pricedInvestment > 0)
      .map(([currency, item]) => [currency, `${(item.profitLoss / item.pricedInvestment * 100) >= 0 ? '+' : ''}${(item.profitLoss / item.pricedInvestment * 100).toFixed(2)}%`]));
  }, [currencyTotals]);

  const { bestPerformer, worstPerformer } = useMemo(() => {
    if (portfolio.length === 0) return { bestPerformer: null, worstPerformer: null };
    const sorted = [...portfolio].sort((a, b) => Number(b.percentageReturn || 0) - Number(a.percentageReturn || 0));
    return {
      bestPerformer: sorted[0],
      worstPerformer: sorted.length > 1 ? sorted[sorted.length - 1] : null,
    };
  }, [portfolio]);

  // Diversification Score (Normalized Herfindahl-Hirschman Index)
  const { diversificationScore, concentrationCategory, topConcentratedStock } = useMemo(() => {
    if (portfolio.length === 0) {
      return { diversificationScore: 0, concentrationCategory: 'No Holdings', topConcentratedStock: null };
    }

    let maxWeight = 0;
    let topStock = null;

    const hhis = Object.keys(currencyTotals).map((currency) => {
      const bucket = portfolio.filter((item) => (item.currency || 'USD') === currency && Number(item.currentValue) > 0);
      const total = bucket.reduce((sum, item) => sum + Number(item.currentValue), 0);
      if (!total) return null;
      let hhi = 0;
      bucket.forEach((item) => {
        const weight = Number(item.currentValue) / total;
        hhi += weight * weight;
        if (weight > maxWeight) {
          maxWeight = weight;
          topStock = { symbol: item.stockSymbol, percentage: (weight * 100).toFixed(1), currency };
        }
      });
      return hhi;
    }).filter((value) => value !== null);
    const hhiSum = hhis.length ? hhis.reduce((sum, value) => sum + value, 0) / hhis.length : 0;

    // Score calculation: 100 for perfectly equal diversification, decreases as HHI increases
    const score = Math.min(100, Math.max(0, Math.round((1 - hhiSum) * 100)));

    let category = 'Low concentration';
    if (score < 50) {
      category = 'High concentration risk';
    } else if (score < 75) {
      category = 'Medium concentration';
    }

    return {
      diversificationScore: score,
      concentrationCategory: category,
      topConcentratedStock: topStock,
    };
  }, [portfolio, currencyTotals]);

  // Deterministic Insights Generator
  const insights = useMemo(() => {
    if (portfolio.length === 0) return [];
    const list = [];

    list.push(`Your portfolio currently consists of ${portfolio.length} asset ${portfolio.length === 1 ? 'holding' : 'holdings'}.`);

    if (topConcentratedStock) {
      list.push(`${topConcentratedStock.percentage}% of your portfolio is concentrated in ${topConcentratedStock.symbol}.`);
    }

    if (bestPerformer) {
      list.push(`${bestPerformer.stockSymbol} is your strongest performer at +${Number(bestPerformer.percentageReturn).toFixed(2)}%.`);
    }

    if (worstPerformer && Number(worstPerformer.percentageReturn) < 0) {
      list.push(`${worstPerformer.stockSymbol} is currently your largest losing position at ${Number(worstPerformer.percentageReturn).toFixed(2)}%.`);
    }

    if (diversificationScore < 50) {
      list.push(`Your portfolio has high concentration risk. Consider adding uncorrelated stocks to improve stability.`);
    } else {
      list.push(`Your portfolio demonstrates healthy asset weight distribution.`);
    }

    return list;
  }, [portfolio, topConcentratedStock, bestPerformer, worstPerformer, diversificationScore]);

  return (
    <Layout title="Analytics">
      {/* Header Banner */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <BarChart3 size={26} color="var(--color-accent)" />
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            Portfolio Analytics
          </h2>
        </div>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          Deep-dive analysis into portfolio performance, diversification, and asset allocation.
        </p>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          <ChartSkeleton />
          <TableSkeleton />
        </div>
      ) : error ? (
        <div className="fintech-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-negative)' }}>
          {error}
        </div>
      ) : portfolio.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Section A: Performance Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <SummaryCard title="Total Invested" value={Object.fromEntries(Object.entries(currencyTotals).map(([currency, value]) => [currency, value.investment]))} />
            <SummaryCard title="Current Value" value={Object.fromEntries(Object.entries(currencyTotals).filter(([, value]) => value.pricedInvestment > 0).map(([currency, value]) => [currency, value.currentValue]))} />
            <SummaryCard title="P/L (priced holdings)" value={Object.fromEntries(Object.entries(currencyTotals).filter(([, value]) => value.pricedInvestment > 0).map(([currency, value]) => [currency, value.profitLoss]))} isProfitLoss />
            <SummaryCard title="Return (priced holdings)" value={overallReturnPercent} isCurrency={false} />
          </div>

          {/* Section B: Historical Chart with Range Buttons */}
          <div className="fintech-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <TrendingUp size={18} color="var(--color-accent)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                  Historical Performance Trend
                </h3>
              </div>

              {/* Range Filters */}
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
                {['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'].map((range) => (
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
                    }}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {snapshotCurrencies.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {snapshotCurrencies.map((currency) => (
                  <div key={currency} style={{ width: '100%', height: 260 }}>
                    <strong>{currency}</strong>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={valueHistory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis dataKey="time" stroke="var(--text-subtle)" fontSize={11} tickLine={false} />
                        <YAxis stroke="var(--text-subtle)" fontSize={11} tickLine={false} tickFormatter={(v) => `${getCurrencySymbol(currency)}${(v / 1000).toFixed(1)}k`} />
                        <Tooltip formatter={(val) => [`${getCurrencySymbol(currency)}${Number(val).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2 })}`, `${currency} value`]} />
                        <Line type="monotone" dataKey={`totalsByCurrency.${currency}`} stroke="var(--color-accent)" strokeWidth={3} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                <Clock size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
                <div>Not enough historical snapshot data for {activeRange} range yet.</div>
              </div>
            )}
          </div>

          {/* Section D & E Grid: Diversification Score & Insights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Diversification Card */}
            <div className="fintech-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <ShieldAlert size={18} color="var(--color-accent)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                    Portfolio Diversification
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--color-accent)', lineHeight: 1 }}>
                    {diversificationScore}
                  </span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-subtle)' }}>/ 100</span>
                </div>

                <span
                  className="badge"
                  style={{
                    backgroundColor: diversificationScore >= 75 ? 'var(--color-positive-bg)' : 'var(--color-negative-bg)',
                    color: diversificationScore >= 75 ? 'var(--color-positive)' : 'var(--color-negative)',
                    fontWeight: '700',
                  }}
                >
                  {concentrationCategory}
                </span>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Score is calculated using normalized Herfindahl-Hirschman index (HHI) concentration math.
              </div>
            </div>

            {/* Portfolio Insights Card */}
            <div className="fintech-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Lightbulb size={18} color="#f59e0b" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                  Deterministic Insights
                </h3>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {insights.map((text, idx) => (
                  <li key={idx} style={{ fontSize: '0.875rem', color: 'var(--text-main)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>•</span>
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section C: Allocation Analysis Table */}
          <div className="fintech-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <PieIcon size={18} color="var(--color-accent)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                Allocation Analysis
              </h3>
            </div>

            <div className="table-responsive">
              <table className="fintech-table">
                <thead>
                  <tr>
                    <th>Stock</th>
                    <th>Current Value</th>
                    <th>Allocation %</th>
                    <th>Profit / Loss</th>
                    <th>Return %</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((item) => {
                    const val = item.currentValue === null || item.currentValue === undefined ? null : Number(item.currentValue || 0);
                    const currency = item.currency || 'USD';
                    const currencyTotal = currencyTotals[currency]?.currentValue || 0;
                    const alloc = val !== null && currencyTotal > 0 ? ((val / currencyTotal) * 100).toFixed(1) : null;
                    const pl = item.profitLoss === null || item.profitLoss === undefined ? null : Number(item.profitLoss || 0);
                    const ret = item.percentageReturn === null || item.percentageReturn === undefined ? null : Number(item.percentageReturn || 0);
                    const isPos = Number(pl) >= 0;

                    return (
                      <tr key={item._id}>
                        <td style={{ fontWeight: '800', color: 'var(--text-main)' }}>{item.stockSymbol}</td>
                        <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                          {val === null ? 'N/A' : getCurrencySymbol(currency) + val.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td>
                          <span style={{ fontWeight: '700', color: 'var(--color-accent)' }}>{alloc === null ? 'N/A' : `${alloc}%`}</span>
                        </td>
                        <td style={{ fontWeight: '700', color: isPos ? 'var(--color-positive)' : 'var(--color-negative)' }}>
                          {pl === null ? 'N/A' : (isPos ? '+' : '-') + getCurrencySymbol(currency) + Math.abs(pl).toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td style={{ fontWeight: '700', color: ret === null ? 'var(--text-muted)' : isPos ? 'var(--color-positive)' : 'var(--color-negative)' }}>
                          {ret === null ? 'N/A' : `${isPos ? '+' : ''}${ret.toFixed(2)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Analytics;
