import React, { useState, useEffect } from 'react';
import { createTransaction } from '../../api/transactionService';
import { useToast } from '../../context/ToastContext';
import { ShoppingBag, ArrowUpRight, ArrowDownRight, Loader2, X } from 'lucide-react';

const TransactionModal = ({ isOpen, onClose, initialSymbol = '', initialPrice = '', initialType = 'BUY', onTransactionSuccess }) => {
  const [type, setType] = useState(initialType);
  const [stockSymbol, setStockSymbol] = useState(initialSymbol);
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState(initialPrice ? String(initialPrice) : '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setStockSymbol(initialSymbol.toUpperCase());
      setPrice(initialPrice ? String(initialPrice) : '');
      setQuantity('1');
      setError('');
    }
  }, [isOpen, initialSymbol, initialPrice, initialType]);

  if (!isOpen) return null;

  const totalAmount = (Number(quantity || 0) * Number(price || 0)).toFixed(2);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const symbol = stockSymbol.trim().toUpperCase();
    const qty = Number(quantity);
    const prc = Number(price);

    if (!symbol) {
      setError('Please enter a valid stock symbol');
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setError('Quantity must be at least 1');
      return;
    }
    if (isNaN(prc) || prc < 0) {
      setError('Price cannot be negative');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createTransaction({
        stockSymbol: symbol,
        type,
        quantity: qty,
        price: prc,
      });

      const successMsg = type === 'BUY'
        ? `✅ ${qty} shares of ${symbol} bought successfully!`
        : `✅ ${qty} shares of ${symbol} sold successfully!`;

      addToast(successMsg, 'success');

      if (onTransactionSuccess) {
        onTransactionSuccess(res.data);
      }
      onClose();
    } catch (err) {
      console.error('Transaction error:', err);
      const errMsg = err.response?.data?.message || 'Transaction failed. Please try again.';
      setError(errMsg);
      addToast(`❌ ${errMsg}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="fintech-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '2rem',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            color: 'var(--text-muted)',
            padding: '4px',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
          <ShoppingBag size={22} color="var(--color-accent)" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
            Execute Order
          </h3>
        </div>

        {/* BUY / SELL Tab Selector */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.5rem',
            backgroundColor: 'var(--bg-input)',
            padding: '0.35rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
          }}
        >
          <button
            type="button"
            onClick={() => setType('BUY')}
            style={{
              padding: '0.6rem',
              fontWeight: '700',
              fontSize: '0.9rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: type === 'BUY' ? 'var(--color-positive)' : 'transparent',
              color: type === 'BUY' ? '#ffffff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowUpRight size={16} />
            BUY
          </button>
          <button
            type="button"
            onClick={() => setType('SELL')}
            style={{
              padding: '0.6rem',
              fontWeight: '700',
              fontSize: '0.9rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: type === 'SELL' ? 'var(--color-negative)' : 'transparent',
              color: type === 'SELL' ? '#ffffff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.35rem',
              transition: 'all 0.15s ease',
            }}
          >
            <ArrowDownRight size={16} />
            SELL
          </button>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-negative-bg)',
              color: 'var(--color-negative)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              fontWeight: '500',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Symbol */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Stock Symbol
            </label>
            <input
              type="text"
              placeholder="e.g. AAPL, RELIANCE"
              value={stockSymbol}
              onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
              required
              className="form-input"
            />
          </div>

          {/* Quantity */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Shares Quantity
            </label>
            <input
              type="number"
              placeholder="e.g. 5"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
              min="1"
              className="form-input"
            />
          </div>

          {/* Execution Price */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Execution Price (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 420.50"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min="0"
              step="0.01"
              className="form-input"
            />
          </div>

          {/* Total Calculation Card */}
          <div
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.25rem',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              Total Order Value
            </span>
            <span style={{ fontSize: '1.2rem', fontWeight: '800', color: type === 'BUY' ? 'var(--color-positive)' : 'var(--color-negative)' }}>
              ₹{Number(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              height: '44px',
              backgroundColor: type === 'BUY' ? 'var(--color-positive)' : 'var(--color-negative)',
              color: '#ffffff',
              fontWeight: '700',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '0.5rem',
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="spin-loader" />
                <span>Processing Order...</span>
              </>
            ) : (
              <span>Confirm {type} Order</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
