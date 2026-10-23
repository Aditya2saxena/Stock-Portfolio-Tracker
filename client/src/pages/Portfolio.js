import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Landmark, PlusCircle, TrendingUp, Wallet } from 'lucide-react';
import { deleteStock, getPortfolio } from '../api/portfolioService';
import { useToast } from '../context/ToastContext';
import Layout from '../components/layout/Layout';
import SummaryCard from '../components/dashboard/SummaryCard';
import HoldingsTable from '../components/dashboard/HoldingsTable';
import TransactionModal from '../components/modals/TransactionModal';
import EmptyState from '../components/common/EmptyState';
import { SummaryCardSkeleton, TableSkeleton } from '../components/common/LoadingSkeleton';
import { getPortfolioTotalsByCurrency } from '../utils/portfolioTotals';

function Portfolio() {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const { addToast } = useToast();

  const loadPortfolio = useCallback(async () => {
    try {
      setError('');
      const response = await getPortfolio();
      setPortfolio(response.data || []);
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to load your portfolio';
      setError(message);
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const totals = useMemo(() => {
    const byCurrency = getPortfolioTotalsByCurrency(portfolio);
    return Object.fromEntries(Object.entries(byCurrency).map(([currency, bucket]) => [currency, {
      invested: bucket.investment,
      currentValue: bucket.currentValue,
      profitLoss: bucket.profitLoss,
      pricedInvestment: bucket.pricedInvestment,
      returnPercentage: bucket.pricedInvestment > 0 ? (bucket.profitLoss / bucket.pricedInvestment) * 100 : 0,
    }]));
  }, [portfolio]);

  const handleDelete = async (id, symbol) => {
    try {
      await deleteStock(id);
      addToast(`${symbol} removed from portfolio`, 'info');
      await loadPortfolio();
    } catch (err) {
      const message = err.response?.data?.message || 'Unable to remove this holding';
      setError(message);
      addToast(message, 'error');
    }
  };

  return (
    <Layout title="Portfolio">
      <div style={{ marginBottom: '1.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <BriefcaseBusiness size={26} color="var(--color-accent)" />
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
              Portfolio
            </h2>
          </div>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Review your holdings, allocation, and live performance.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setIsOrderOpen(true)}>
          <PlusCircle size={18} />
          Add holding
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--color-negative-bg)', color: 'var(--color-negative)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
        {loading ? (
          <><SummaryCardSkeleton /><SummaryCardSkeleton /><SummaryCardSkeleton /><SummaryCardSkeleton /></>
        ) : (
          <>
            <SummaryCard title="Total Invested" value={Object.fromEntries(Object.entries(totals).map(([currency, value]) => [currency, value.invested]))} icon={Wallet} />
            <SummaryCard title="Current Value" value={Object.fromEntries(Object.entries(totals).filter(([, value]) => value.pricedInvestment > 0).map(([currency, value]) => [currency, value.currentValue]))} icon={Landmark} />
            <SummaryCard title="P/L (priced holdings)" value={Object.fromEntries(Object.entries(totals).filter(([, value]) => value.pricedInvestment > 0).map(([currency, value]) => [currency, value.profitLoss]))} isProfitLoss icon={TrendingUp} />
            <SummaryCard title="Return (priced holdings)" value={Object.fromEntries(Object.entries(totals).filter(([, value]) => value.pricedInvestment > 0).map(([currency, value]) => [currency, `${value.returnPercentage >= 0 ? '+' : ''}${value.returnPercentage.toFixed(2)}%`]))} isCurrency={false} icon={TrendingUp} />
          </>
        )}
      </div>

      {loading ? <TableSkeleton /> : portfolio.length ? (
        <HoldingsTable portfolio={portfolio} onDelete={handleDelete} showAllocation />
      ) : (
        <EmptyState onAddClick={() => setIsOrderOpen(true)} />
      )}

      <TransactionModal
        isOpen={isOrderOpen}
        onClose={() => setIsOrderOpen(false)}
        initialType="BUY"
        onTransactionSuccess={loadPortfolio}
      />
    </Layout>
  );
}

export default Portfolio;
