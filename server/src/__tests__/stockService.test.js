const stockService = require('../services/stockService');

describe('Stock Service Integration & Fallback', () => {
  test('retrieves real stock quote for US stock AAPL', async () => {
    const data = await stockService.getStockPrice('AAPL');
    expect(data).toBeDefined();
    expect(data.symbol).toBe('AAPL');
    expect(data.currentPrice).toBeGreaterThan(0);
    expect(['live', 'cached', 'demo']).toContain(data.dataSource);
  }, 10000);

  test('retrieves real stock quote for Indian stock TCS', async () => {
    const data = await stockService.getStockPrice('TCS');
    expect(data).toBeDefined();
    expect(data.symbol).toBe('TCS');
    expect(data.currency).toBe('INR');
    expect(data.currentPrice).toBeGreaterThan(0);
  }, 10000);

  test('fetches historical chart data for 1M range', async () => {
    const history = await stockService.getHistoricalData('AAPL', '1M');
    expect(Array.isArray(history)).toBe(true);
    if (history.length > 0) {
      expect(history[0]).toHaveProperty('time');
      expect(history[0]).toHaveProperty('price');
    }
  }, 10000);

  test('searches stocks by query string', async () => {
    const results = await stockService.searchStocksService('RELIANCE');
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.symbol.includes('RELIANCE'))).toBe(true);
  }, 10000);
});
