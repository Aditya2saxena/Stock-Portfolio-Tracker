import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  getPortfolio,
  deleteStock,
  saveSnapshot,
  getSnapshotHistory,
} from '../api/portfolioService';
import { getTransactions } from '../api/transactionService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import socket from '../socket';
import { getPortfolioTotalsByCurrency } from '../utils/portfolioTotals';

import Layout from '../components/layout/Layout';
import SummaryCard from '../components/dashboard/SummaryCard';
import PortfolioChart from '../components/dashboard/PortfolioChart';
import AllocationChart from '../components/dashboard/AllocationChart';
import PerformerCard from '../components/dashboard/PerformerCard';
import HoldingsTable from '../components/dashboard/HoldingsTable';
import AddStockForm from '../components/dashboard/AddStockForm';
import RecentTransactions from '../components/dashboard/RecentTransactions';
import TransactionModal from '../components/modals/TransactionModal';
import EmptyState from '../components/common/EmptyState';
import {
  SummaryCardSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from '../components/common/LoadingSkeleton';

import { DollarSign, Wallet, TrendingUp, Percent, ShoppingBag, HeartPulse, Activity } from 'lucide-react';

function Dashboard() {
  const [portfolio, setPortfolio] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [valueHistory, setValueHistory] = useState([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('BUY');
  const [modalSymbol, setModalSymbol] = useState('');
  const [modalPrice, setModalPrice] = useState('');

  const { user } = useAuth();
  const { addToast } = useToast();
  const addStockSectionRef = useRef(null);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Investor';

  const fetchDashboardData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      setError('');
      const [portfolioRes, transactionsRes] = await Promise.all([
        getPortfolio(),
        getTransactions({ limit: 5 }),
      ]);
      setPortfolio(portfolioRes.data || []);
      setTransactions(transactionsRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      const errMsg = err.response?.data?.message || 'Failed to load portfolio data';
      setError(errMsg);
      addToast(`❌ ${errMsg}`, 'error');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchDashboardData(true);

    getSnapshotHistory()
      .then((res) => {
        setValueHistory(res.data || []);
      })
      .catch((err) => {
        console.error('Failed to load snapshot history:', err);
        setValueHistory([]);
      });
  }, [fetchDashboardData]);

  const portfolioSymbolsKey = portfolio.map((item) => item.stockSymbol).sort().join('|');

  // Socket.io updates are scoped to this user's subscribed symbols.
  useEffect(() => {
    const symbols = portfolioSymbolsKey ? portfolioSymbolsKey.split('|') : [];
    if (symbols.length === 0) return;

    // Notify server which symbols we need updates for
    const subscribe = () => socket.emit('subscribe:symbols', symbols);
    socket.on('connect', subscribe);
    if (socket.connected) subscribe();

    const handlePriceUpdate = (updatedStock) => {
      setPortfolio((prevPortfolio) =>
        prevPortfolio.map((item) => {
          // Match by display symbol or full normalized symbol (e.g. TCS matches TCS.NS updates)
          const isMatch =
            item.stockSymbol.toUpperCase() === updatedStock.symbol?.toUpperCase() ||
            item.stockSymbol.toUpperCase() === updatedStock.fullSymbol?.toUpperCase();

          if (isMatch) {
            const currentPrice = Number(updatedStock.currentPrice);
            const investment = Number(item.buyPrice || 0) * Number(item.quantity || 0);
            const currentValue = currentPrice * Number(item.quantity || 0);
            const profitLoss = currentValue - investment;
            const percentageReturn =
              investment > 0 ? ((profitLoss / investment) * 100).toFixed(2) : '0.00';

            return {
              ...item,
              currentPrice,
              investment,
              currentValue,
              profitLoss,
              percentageReturn,
              dataSource: updatedStock.dataSource || 'live',
              marketStatus: updatedStock.marketStatus,
            };
          }
          return item;
        })
      );
    };

    socket.on('priceUpdate', handlePriceUpdate);

    return () => {
      socket.off('connect', subscribe);
      if (socket.connected) socket.emit('unsubscribe:symbols', symbols);
      socket.off('priceUpdate', handlePriceUpdate);
    };
  }, [portfolioSymbolsKey]);

  // Calculations
  const currencyTotals = useMemo(() => getPortfolioTotalsByCurrency(portfolio), [portfolio]);
  const totalInvestment = useMemo(() => Object.fromEntries(Object.entries(currencyTotals).map(([currency, totals]) => [currency, totals.investment])), [currencyTotals]);
  const totalCurrentValue = useMemo(() => Object.fromEntries(Object.entries(currencyTotals).filter(([, totals]) => totals.pricedInvestment > 0).map(([currency, totals]) => [currency, totals.currentValue])), [currencyTotals]);
  const totalProfitLoss = useMemo(() => Object.fromEntries(Object.entries(currencyTotals).filter(([, totals]) => totals.pricedInvestment > 0).map(([currency, totals]) => [currency, totals.profitLoss])), [currencyTotals]);
  const overallReturnPercent = useMemo(() => Object.fromEntries(Object.entries(currencyTotals).map(([currency, totals]) => [
    currency,
    totals.pricedInvestment > 0 ? (totals.profitLoss / totals.pricedInvestment) * 100 : 0,
  ])), [currencyTotals]);

  // Today's P/L calculation from intraday snapshots
  const todaysPL = useMemo(() => {
    const today = new Date().toDateString();
    const pointsToday = valueHistory.filter((point) => point.date && new Date(point.date).toDateString() === today);
    if (pointsToday.length < 2) return null;
    const first = pointsToday[0].totalsByCurrency;
    const latest = pointsToday[pointsToday.length - 1].totalsByCurrency;
    if (!first || !latest) return null;
    return Object.fromEntries(Array.from(new Set([...Object.keys(first), ...Object.keys(latest)])).map((currency) => [
      currency,
      Number(latest[currency] || 0) - Number(first[currency] || 0),
    ]));
  }, [valueHistory]);

  const { bestPerformer, worstPerformer } = useMemo(() => {
    if (portfolio.length === 0) return { bestPerformer: null, worstPerformer: null };

    const sorted = [...portfolio].sort((a, b) => {
      const returnA = Number(a.percentageReturn || 0);
      const returnB = Number(b.percentageReturn || 0);
      return returnB - returnA;
    });

    return {
      bestPerformer: sorted[0],
      worstPerformer: sorted.length > 1 ? sorted[sorted.length - 1] : null,
    };
  }, [portfolio]);

  // Deterministic Portfolio Health Score (Base: diversification + performance + asset count)
  const healthScore = useMemo(() => {
    if (portfolio.length === 0) return 0;
    let score = 50; // base score

    // Asset count bonus
    score += Math.min(20, portfolio.length * 4);

    // Performance factor
    const returns = Object.values(overallReturnPercent);
    const averageReturn = returns.length ? returns.reduce((sum, value) => sum + value, 0) / returns.length : 0;
    score += averageReturn > 0 ? Math.min(20, averageReturn) : Math.max(-20, averageReturn);

    // Concentration penalty/bonus using HHI
    const currencyHhis = Object.keys(currencyTotals).map((currency) => {
      const bucket = portfolio.filter((item) => (item.currency || 'USD') === currency && Number(item.currentValue) > 0);
      const total = bucket.reduce((sum, item) => sum + Number(item.currentValue), 0);
      return total ? bucket.reduce((sum, item) => sum + (Number(item.currentValue) / total) ** 2, 0) : null;
    }).filter((value) => value !== null);
    if (currencyHhis.length) score += Math.round((1 - currencyHhis.reduce((sum, value) => sum + value, 0) / currencyHhis.length) * 10);

    return Math.min(100, Math.max(0, Math.round(score)));
  }, [portfolio, overallReturnPercent, currencyTotals]);

  // Snapshot persistence
  useEffect(() => {
    if (!Object.values(totalCurrentValue).some((value) => value > 0)) return;

    const newPoint = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: new Date().toISOString(),
      totalsByCurrency: Object.fromEntries(Object.entries(totalCurrentValue).map(([currency, value]) => [currency, Number(value.toFixed(2))])),
    };

    setValueHistory((prev) => {
      const updated = [...prev, newPoint];
      return updated.slice(-20);
    });

    saveSnapshot().catch((err) => {
      console.error('Failed to save snapshot:', err);
    });
  }, [totalCurrentValue]);

  const handleOpenTransactionModal = (type = 'BUY', symbol = '', price = '') => {
    setModalType(type);
    setModalSymbol(symbol);
    setModalPrice(price);
    setIsModalOpen(true);
  };

  const handleDeleteStock = async (id, symbol) => {
    try {
      setError('');
      await deleteStock(id);
      addToast(`🗑 ${symbol} removed from portfolio`, 'info');
      await fetchDashboardData();
    } catch (err) {
      console.error('Failed to delete stock:', err);
      const errMsg = err.response?.data?.message || 'Failed to delete stock';
      setError(errMsg);
      addToast(`❌ ${errMsg}`, 'error');
    }
  };

  const scrollToAddForm = () => {
    if (addStockSectionRef.current) {
      addStockSectionRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <Layout title="Dashboard">
      {/* Header Banner */}
      <div
        style={{
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
            {getGreeting()}, {firstName} 👋
          </h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Here's your portfolio overview and real-time performance update.
          </p>
        </div>

        <button onClick={() => handleOpenTransactionModal('BUY')} className="btn-primary" style={{ height: '42px' }}>
          <ShoppingBag size={18} />
          <span>Execute Order</span>
        </button>
      </div>

      {/* Summary Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.75rem',
        }}
      >
        {loading ? (
          <>
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
            <SummaryCardSkeleton />
          </>
        ) : (
          <>
            <SummaryCard title="Total Invested" value={totalInvestment} icon={Wallet} />
            <SummaryCard title="Current Value" value={totalCurrentValue} icon={DollarSign} />
            <SummaryCard title="P/L (priced holdings)" value={totalProfitLoss} isProfitLoss icon={TrendingUp} />
            <SummaryCard title="Return (priced holdings)" value={Object.fromEntries(Object.entries(overallReturnPercent).filter(([currency]) => currencyTotals[currency]?.pricedInvestment > 0).map(([currency, value]) => [currency, `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`]))} isCurrency={false} icon={Percent} />
          </>
        )}
      </div>

      {/* Intraday P/L & Health Score Banner */}
      {!loading && portfolio.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
          {/* Today's P/L Card */}
          <div className="fintech-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>Today's P/L</span>
              <Activity size={18} color="var(--color-accent)" />
            </div>
            {todaysPL !== null ? (
              <div style={{ fontSize: '1.1rem', fontWeight: '800', display: 'grid', gap: '0.2rem' }}>
                {Object.entries(todaysPL).map(([currency, value]) => <span key={currency} style={{ color: value >= 0 ? 'var(--color-positive)' : 'var(--color-negative)' }}>{currency} {value >= 0 ? '+' : '-'}{Math.abs(value).toFixed(2)}</span>)}
              </div>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                N/A — insufficient intraday data
              </div>
            )}
          </div>

          {/* Portfolio Health Score Card */}
          <div className="fintech-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HeartPulse size={20} color="var(--color-accent)" />
                <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-main)' }}>Portfolio Health</span>
              </div>
              <span style={{ fontSize: '1.3rem', fontWeight: '800', color: 'var(--color-accent)' }}>
                {healthScore} / 100
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '0.5rem', fontStyle: 'italic' }}>
              "Portfolio health is a technical analytics indicator, not financial advice."
            </div>
          </div>
        </div>
      )}

      {/* Charts & Performers Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem', marginBottom: '1.75rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
            <PortfolioChart valueHistory={valueHistory} />
            <AllocationChart portfolio={portfolio} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {portfolio.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <PerformerCard title="Best Performer" performer={bestPerformer} type="best" />
                <PerformerCard title="Worst Performer" performer={worstPerformer} type="worst" />
              </div>
            )}
            <RecentTransactions transactions={transactions} />
          </div>
        </div>
      )}

      {/* Add Stock Section */}
      <div ref={addStockSectionRef} style={{ marginBottom: '1.75rem' }}>
        <AddStockForm
          onAddStock={(formData, resetForm) => {
            handleOpenTransactionModal('BUY', formData.stockSymbol, formData.buyPrice);
            resetForm();
          }}
          submitting={false}
          validationError={error}
        />
      </div>

      {/* Holdings Section */}
      <div style={{ marginBottom: '1.75rem' }}>
        {loading ? (
          <TableSkeleton />
        ) : portfolio.length === 0 ? (
          <EmptyState onAddClick={scrollToAddForm} />
        ) : (
          <HoldingsTable portfolio={portfolio} onDelete={handleDeleteStock} loading={loading} />
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialSymbol={modalSymbol}
        initialPrice={modalPrice}
        initialType={modalType}
        onTransactionSuccess={fetchDashboardData}
      />
    </Layout>
  );
}

export default Dashboard;
