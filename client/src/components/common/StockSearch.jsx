import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchStocks } from '../../api/stockService';
import { Search, Loader2, TrendingUp, X } from 'lucide-react';

const StockSearch = ({ placeholder = 'Search symbol or company (e.g. AAPL, RELIANCE)...', className = '' }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const searchContainerRef = useRef(null);

  // Debounced Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const res = await searchStocks(query.trim());
        setResults(res.data || []);
        setIsOpen(true);
      } catch (err) {
        console.error('Stock search error:', err);
        setError('Failed to fetch search results');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (symbol) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/stock/${symbol}`);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={searchContainerRef} style={{ position: 'relative', width: '100%' }} className={className}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '0.85rem',
            color: 'var(--text-subtle)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          className="form-input"
          style={{
            paddingLeft: '2.4rem',
            paddingRight: query ? '2.2rem' : '0.85rem',
            height: '40px',
            fontSize: '0.875rem',
          }}
        />
        {loading ? (
          <Loader2
            size={16}
            className="spin-loader"
            style={{
              position: 'absolute',
              right: '0.85rem',
              color: 'var(--color-accent)',
            }}
          />
        ) : query ? (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '0.75rem',
              background: 'transparent',
              color: 'var(--text-subtle)',
              padding: '2px',
            }}
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      {/* Dropdown Results Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          {error ? (
            <div style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: 'var(--color-negative)' }}>
              {error}
            </div>
          ) : results.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No matching stocks found for "{query}"
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {results.map((item) => (
                <div
                  key={item.symbol}
                  onClick={() => handleSelectResult(item.symbol)}
                  style={{
                    padding: '0.75rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border-color)',
                    transition: 'background-color 0.15s ease',
                  }}
                  className="search-item-row"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-accent-light)',
                        color: 'var(--color-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1.2 }}>
                        {item.symbol}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {item.name}
                      </div>
                    </div>
                  </div>

                  {item.region && (
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: '600',
                        color: 'var(--text-subtle)',
                        backgroundColor: 'var(--bg-input)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                      }}
                    >
                      {item.region}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        .search-item-row:hover {
          background-color: var(--bg-card-hover) !important;
        }
      `}</style>
    </div>
  );
};

export default StockSearch;
