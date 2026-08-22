import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStockDetails } from '../api/stockService';
import { getPortfolio } from '../api/portfolioService';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '../api/watchlistService';
import Layout from '../components/layout/Layout';
import TransactionModal from '../components/modals/TransactionModal';
import { useToast } from '../context/ToastContext';
import {
  TrendingUp,
  TrendingDown,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  Layers,
  Activity,
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

function StockDetails() {
  const { symbol } = useParams();
  const navigate = useNavigate();

  const [stock, setStock] = useState(null);
  const [holding, setHolding] = useState(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRange, setActiveRange] = useState('1D');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('BUY');

  const { addToast } = useToast();

  const fetchStockAndPosition = useCallback(async () => {
    if (!symbol) return;
    try {
      setLoading(true);
      setError('');

      // 1. Fetch Stock Market Data
      const stockRes = await getStockDetails(symbol);
      setStock(stockRes.data);

      // 2. Fetch User Portfolio Position
      const portfolioRes = await getPortfolio();
      const userHoldings = portfolioRes.data || [];
      const matchHolding = userHoldings.find((item) => item.stockSymbol === symbol.toUpperCase());
      setHolding(matchHolding || null);

      // 3. Fetch Watchlist Status
      const watchlistRes = await getWatchlist();
      const isStarred = (watchlistRes.data || []).some(
        (item) => item.stockSymbol === symbol.toUpperCase()
      );
      setInWatchlist(isStarred);
    } catch (err) {
      console.error('Failed to load stock details:', err);
      setError(err.response?.data?.message || `Failed to load stock data for ${symbol}`);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchStockAndPosition();
  }, [fetchStockAndPosition]);

  // Handle Watchlist Toggle
  const handleWatchlistToggle = async () => {
    const cleanSymbol = symbol.toUpperCase();
    try {
      if (inWatchlist) {
        await removeFromWatchlist(cleanSymbol);
        setInWatchlist(false);
        addToast(`🗑 ${cleanSymbol} removed from watchlist`, 'info');
      } else {
        await addToWatchlist({ stockSymbol: cleanSymbol });
        setInWatchlist(true);
        addToast(`⭐ ${cleanSymbol} added to watchlist`, 'success');
      }
    } catch (err) {
      addToast('❌ Watchlist update failed', 'error');
    }
  };

  const handleOpenModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  // Generate simulated chart history around current price for visual chart
  const generateMockChartData = (currentPrice) => {
    const base = Number(currentPrice || 100);
    const points = [];
    const times = ['09:30', '10:30', '11:30', '12:30', '13:30', '14:30', '15:30'];
    let val = base * 0.985;
    times.forEach((t, i) => {
      val = val + (Math.random() - 0.45) * (base * 0.015);
      points.push({
        time: t,
        price: Number(val.toFixed(2)),
      });
    });
    // ensure last point equals current price
    points[points.length - 1].price = base;
    return points;
  };

  const currentPrice = stock?.currentPrice ? Number(stock.currentPrice) : 0;
  const change = stock?.change !== undefined ? Number(stock.change) : 0;
  const percentChange = stock?.percentChange !== undefined ? Number(stock.percentChange) : 0;
  const isPositive = change >= 0;

  const chartData = stock ? generateMockChartData(currentPrice) : [];

  return (
    <Layout title={`Stock / ${symbol ? symbol.toUpperCase() : ''}`}>
      {loading ? (
        <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Activity size={32} className="spin-loader" style={{ margin: '0 auto 1rem', color: 'var(--color-accent)' }} />
          <div>Loading {symbol?.toUpperCase()} details...</div>
        </div>
      ) : error ? (
        <div className="fintech-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-negative)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Unable to load stock</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">
            Return to Dashboard
          </button>
        </div>
      ) : (
        <div>
          {/* Header Card */}
          <div
            className="fintech-card"
            style={{
              padding: '1.75rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1.25rem',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.02em', margin: 0 }}>
                  {stock.symbol}
                </h2>
                <span
                  className={`badge badge-${stock.dataSource || 'live'}`}
                  style={{ fontSize: '0.75rem' }}
                >
                  {stock.dataSource || 'live'}
                </span>
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                {stock.name || stock.symbol}
              </p>
            </div>

            {/* Price Info & Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.1 }}>
                  ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.35rem' }}>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: isPositive ? 'var(--color-positive-bg)' : 'var(--color-negative-bg)',
                      color: isPositive ? 'var(--color-positive)' : 'var(--color-negative)',
                      fontWeight: '700',
                    }}
                  >
                    {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {isPositive ? '+₹' : '-₹'}
                    {Math.abs(change).toFixed(2)} ({isPositive ? '+' : ''}
                    {percentChange.toFixed(2)}%)
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={handleWatchlistToggle}
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-color)',
                    color: inWatchlist ? '#f59e0b' : 'var(--text-muted)',
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                  }}
                >
                  <Star size={18} fill={inWatchlist ? '#f59e0b' : 'none'} />
                  <span>{inWatchlist ? 'Watchlisted' : 'Watchlist'}</span>
                </button>

                <button
                  onClick={() => handleOpenModal('BUY')}
                  style={{
                    backgroundColor: 'var(--color-positive)',
                    color: '#ffffff',
                    padding: '0.65rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '0.9rem',
                  }}
                >
                  <ArrowUpRight size={18} />
                  <span>Buy</span>
                </button>

                {holding && holding.quantity > 0 && (
                  <button
                    onClick={() => handleOpenModal('SELL')}
                    style={{
                      backgroundColor: 'var(--color-negative)',
                      color: '#ffffff',
                      padding: '0.65rem 1.25rem',
                      borderRadius: 'var(--radius-md)',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      fontSize: '0.9rem',
                    }}
                  >
                    <ArrowDownRight size={18} />
                    <span>Sell</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* User's Position Card (if owned) */}
          {holding && holding.quantity > 0 && (
            <div
              className="fintech-card"
              style={{
                padding: '1.5rem',
                marginBottom: '1.5rem',
                backgroundColor: 'var(--color-accent-light)',
                borderColor: 'var(--color-accent)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <Briefcase size={20} color="var(--color-accent)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                  Your Position in {stock.symbol}
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Quantity Owned</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {holding.quantity} shares
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avg Buy Price</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    ₹{Number(holding.buyPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Invested</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    ₹{(Number(holding.buyPrice || 0) * holding.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Value</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    ₹{(currentPrice * holding.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Profit / Loss</div>
                  <div
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: '800',
                      color: (currentPrice * holding.quantity - Number(holding.buyPrice || 0) * holding.quantity) >= 0
                        ? 'var(--color-positive)'
                        : 'var(--color-negative)',
                      marginTop: '0.25rem',
                    }}
                  >
                    {(currentPrice * holding.quantity - Number(holding.buyPrice || 0) * holding.quantity) >= 0 ? '+₹' : '-₹'}
                    {Math.abs(currentPrice * holding.quantity - Number(holding.buyPrice || 0) * holding.quantity).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid Layout: Chart & Market Statistics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="stock-details-grid">
            {/* Interactive Price Chart */}
            <div className="fintech-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <TrendingUp size={18} color="var(--color-accent)" />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                    Price Movement
                  </h3>
                </div>

                {/* Range selectors */}
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
                  {['1D', '1W', '1M', '3M', '6M', '1Y'].map((range) => (
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

              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="time" stroke="var(--text-subtle)" fontSize={11} tickLine={false} />
                    <YAxis stroke="var(--text-subtle)" fontSize={11} tickLine={false} domain={['auto', 'auto']} tickFormatter={(val) => `₹${val}`} />
                    <Tooltip formatter={(val) => [`₹${Number(val).toFixed(2)}`, 'Price']} />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke={isPositive ? 'var(--color-positive)' : 'var(--color-negative)'}
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Market Information Cards */}
            <div className="fintech-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Layers size={18} color="var(--color-accent)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                  Market Information
                </h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Current Price</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    ₹{currentPrice ? currentPrice.toFixed(2) : 'N/A'}
                  </div>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Day High</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-positive)', marginTop: '0.25rem' }}>
                    {stock.high ? `₹${Number(stock.high).toFixed(2)}` : 'N/A'}
                  </div>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Day Low</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--color-negative)', marginTop: '0.25rem' }}>
                    {stock.low ? `₹${Number(stock.low).toFixed(2)}` : 'N/A'}
                  </div>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Opening Price</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {stock.open ? `₹${Number(stock.open).toFixed(2)}` : 'N/A'}
                  </div>
                </div>

                <div style={{ padding: '0.85rem', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-input)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600' }}>Previous Close</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {stock.previousClose ? `₹${Number(stock.previousClose).toFixed(2)}` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {stock && (
        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          initialSymbol={stock.symbol}
          initialPrice={currentPrice}
          initialType={modalType}
          onTransactionSuccess={fetchStockAndPosition}
        />
      )}
    </Layout>
  );
}

export default StockDetails;
