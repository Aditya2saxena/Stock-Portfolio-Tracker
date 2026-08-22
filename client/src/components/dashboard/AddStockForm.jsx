import React, { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';

const AddStockForm = ({ onAddStock, submitting, validationError }) => {
  const [formData, setFormData] = useState({
    stockSymbol: '',
    quantity: '',
    buyPrice: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddStock(formData, () => {
      setFormData({
        stockSymbol: '',
        quantity: '',
        buyPrice: '',
      });
    });
  };

  return (
    <div className="fintech-card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <PlusCircle size={20} color="var(--color-accent)" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
          Add to Portfolio
        </h3>
      </div>

      {validationError && (
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
          {validationError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            alignItems: 'end',
          }}
        >
          {/* Stock Symbol */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: 'var(--text-muted)',
                marginBottom: '0.4rem',
              }}
            >
              Stock Symbol
            </label>
            <input
              type="text"
              placeholder="e.g. AAPL, RELIANCE"
              value={formData.stockSymbol}
              onChange={(e) => setFormData({ ...formData, stockSymbol: e.target.value.toUpperCase() })}
              required
              className="form-input"
            />
          </div>

          {/* Quantity */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: 'var(--text-muted)',
                marginBottom: '0.4rem',
              }}
            >
              Quantity
            </label>
            <input
              type="number"
              placeholder="e.g. 10"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              required
              min="1"
              className="form-input"
            />
          </div>

          {/* Buy Price */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: '600',
                color: 'var(--text-muted)',
                marginBottom: '0.4rem',
              }}
            >
              Buy Price (₹)
            </label>
            <input
              type="number"
              placeholder="e.g. 150.00"
              value={formData.buyPrice}
              onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
              required
              min="0"
              step="0.01"
              className="form-input"
            />
          </div>

          {/* Submit Button */}
          <div>
            <button type="submit" className="btn-primary" disabled={submitting} style={{ width: '100%', height: '42px' }}>
              {submitting ? (
                <>
                  <Loader2 size={18} className="spin-loader" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={18} />
                  <span>Add Stock</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-loader {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default AddStockForm;
