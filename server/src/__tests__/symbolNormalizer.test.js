const { normalizeSymbol } = require('../utils/symbolNormalizer');

describe('Symbol Normalizer Utility', () => {
  test('normalizes standard US tickers', () => {
    const res = normalizeSymbol('aapl');
    expect(res.normalizedSymbol).toBe('AAPL');
    expect(res.displaySymbol).toBe('AAPL');
    expect(res.market).toBe('US');
    expect(res.currency).toBe('USD');
  });

  test('normalizes Indian ticker without suffix (e.g. TCS)', () => {
    const res = normalizeSymbol('TCS');
    expect(res.normalizedSymbol).toBe('TCS.NS');
    expect(res.displaySymbol).toBe('TCS');
    expect(res.market).toBe('NSE');
    expect(res.currency).toBe('INR');
  });

  test('normalizes Indian ticker with :NSE format (e.g. RELIANCE:NSE)', () => {
    const res = normalizeSymbol('RELIANCE:NSE');
    expect(res.normalizedSymbol).toBe('RELIANCE.NS');
    expect(res.displaySymbol).toBe('RELIANCE');
    expect(res.market).toBe('NSE');
    expect(res.currency).toBe('INR');
  });

  test('normalizes Indian ticker with .NS suffix', () => {
    const res = normalizeSymbol('INFY.NS');
    expect(res.normalizedSymbol).toBe('INFY.NS');
    expect(res.displaySymbol).toBe('INFY');
    expect(res.market).toBe('NSE');
    expect(res.currency).toBe('INR');
  });

  test('handles empty or invalid inputs gracefully', () => {
    const res = normalizeSymbol(null);
    expect(res.displaySymbol).toBe('');
    expect(res.market).toBe('UNKNOWN');
  });
});
