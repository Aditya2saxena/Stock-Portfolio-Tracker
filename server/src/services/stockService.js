const { normalizeSymbol, KNOWN_INDIAN_STOCKS } = require('../utils/symbolNormalizer');
const cacheService = require('./cacheService');
const marketDataProvider = require('./marketDataProvider');

// Demo prices array ONLY for offline fallback when provider is unreachable
const DEMO_PRICES = {
  'AAPL': { currentPrice: 227.50, change: 1.20, percentChange: 0.53, high: 228.10, low: 225.30, open: 226.00, previousClose: 226.30, name: 'Apple Inc.', currency: 'USD', exchange: 'NASDAQ' },
  'MSFT': { currentPrice: 420.50, change: 2.30, percentChange: 0.55, high: 422.00, low: 418.00, open: 419.00, previousClose: 418.20, name: 'Microsoft Corporation', currency: 'USD', exchange: 'NASDAQ' },
  'GOOGL': { currentPrice: 175.40, change: -1.10, percentChange: -0.62, high: 177.20, low: 174.50, open: 176.50, previousClose: 176.50, name: 'Alphabet Inc.', currency: 'USD', exchange: 'NASDAQ' },
  'AMZN': { currentPrice: 186.20, change: 3.40, percentChange: 1.86, high: 187.50, low: 183.10, open: 184.00, previousClose: 182.80, name: 'Amazon.com Inc.', currency: 'USD', exchange: 'NASDAQ' },
  'TSLA': { currentPrice: 245.80, change: -3.40, percentChange: -1.36, high: 250.20, low: 244.10, open: 249.00, previousClose: 249.20, name: 'Tesla Inc.', currency: 'USD', exchange: 'NASDAQ' },
  'NVDA': { currentPrice: 128.50, change: 4.20, percentChange: 3.38, high: 129.80, low: 125.10, open: 126.00, previousClose: 124.30, name: 'NVIDIA Corporation', currency: 'USD', exchange: 'NASDAQ' },
  'META': { currentPrice: 485.10, change: -2.30, percentChange: -0.47, high: 490.00, low: 482.00, open: 488.00, previousClose: 487.40, name: 'Meta Platforms Inc.', currency: 'USD', exchange: 'NASDAQ' },
  'RELIANCE': { currentPrice: 1315.55, change: 12.30, percentChange: 0.94, high: 1320.00, low: 1305.00, open: 1310.00, previousClose: 1303.25, name: 'Reliance Industries Ltd.', currency: 'INR', exchange: 'NSE' },
  'TCS': { currentPrice: 3200.40, change: -8.20, percentChange: -0.26, high: 3215.00, low: 3190.00, open: 3210.00, previousClose: 3208.60, name: 'Tata Consultancy Services Ltd.', currency: 'INR', exchange: 'NSE' },
  'INFY': { currentPrice: 1520.25, change: 5.10, percentChange: 0.34, high: 1525.00, low: 1512.00, open: 1515.00, previousClose: 1515.15, name: 'Infosys Ltd.', currency: 'INR', exchange: 'NSE' },
  'HDFCBANK': { currentPrice: 1650.00, change: 8.50, percentChange: 0.52, high: 1660.00, low: 1642.00, open: 1645.00, previousClose: 1641.50, name: 'HDFC Bank Ltd.', currency: 'INR', exchange: 'NSE' },
  'ICICIBANK': { currentPrice: 1210.30, change: -4.10, percentChange: -0.34, high: 1222.00, low: 1205.00, open: 1218.00, previousClose: 1214.40, name: 'ICICI Bank Ltd.', currency: 'INR', exchange: 'NSE' },
  'TATAMOTORS': { currentPrice: 980.50, change: 14.20, percentChange: 1.47, high: 988.00, low: 968.00, open: 970.00, previousClose: 966.30, name: 'Tata Motors Ltd.', currency: 'INR', exchange: 'NSE' },
  'SBIN': { currentPrice: 835.40, change: 2.10, percentChange: 0.25, high: 841.00, low: 830.00, open: 832.00, previousClose: 833.30, name: 'State Bank of India', currency: 'INR', exchange: 'NSE' },
  'WIPRO': { currentPrice: 525.60, change: -1.40, percentChange: -0.27, high: 530.00, low: 522.00, open: 528.00, previousClose: 527.00, name: 'Wipro Ltd.', currency: 'INR', exchange: 'NSE' },
};

/**
 * Main Stock Quote retrieval adhering to Fallback Hierarchy:
 * 1. LIVE API
 * 2. FRESH CACHE
 * 3. STALE CACHE
 * 4. DEMO DATA (explicitly labelled)
 * 5. ERROR
 */
exports.getStockPrice = async (symbol) => {
  const normInfo = normalizeSymbol(symbol);
  const cacheKey = normInfo.normalizedSymbol;

  // STEP 1 & 2: Check Fresh Cache
  const cached = cacheService.getQuote(cacheKey);
  if (cached && cached.isFresh) {
    return { ...cached.data, dataSource: 'live' };
  }

  // STEP 3: Try Live External API
  try {
    const liveQuote = await marketDataProvider.fetchQuote(normInfo);
    cacheService.setQuote(cacheKey, liveQuote);
    return { ...liveQuote, dataSource: 'live' };
  } catch (liveError) {
    console.warn(`⚠️ Provider quote fetch failed for ${cacheKey}: ${liveError.message}`);

    // Check Stale Cache
    if (cached && cached.data) {
      const minutesAgo = Math.round((Date.now() - cached.timestamp) / 60000);
      return {
        ...cached.data,
        dataSource: 'cached',
        lastUpdated: cached.timestamp,
        cacheInfo: `Last updated ${minutesAgo} minute${minutesAgo === 1 ? '' : 's'} ago`,
      };
    }

    // STEP 4: Demo Fallback
    const demoKey = normInfo.displaySymbol;
    if (DEMO_PRICES[demoKey]) {
      const demoData = DEMO_PRICES[demoKey];
      return {
        symbol: normInfo.displaySymbol,
        fullSymbol: normInfo.normalizedSymbol,
        name: demoData.name,
        currentPrice: demoData.currentPrice,
        change: demoData.change,
        percentChange: demoData.percentChange,
        high: demoData.high,
        low: demoData.low,
        open: demoData.open,
        previousClose: demoData.previousClose,
        volume: 100000,
        currency: demoData.currency,
        exchange: demoData.exchange,
        dataSource: 'demo',
        timestamp: new Date().toISOString(),
        marketStatus: 'CLOSED',
        notice: 'Demo data — live market data unavailable',
      };
    }

    // STEP 5: Controlled Error Response
    return {
      symbol: normInfo.displaySymbol,
      fullSymbol: normInfo.normalizedSymbol,
      name: normInfo.displaySymbol,
      currentPrice: 0,
      change: 0,
      percentChange: 0,
      high: 0,
      low: 0,
      open: 0,
      previousClose: 0,
      volume: 0,
      currency: normInfo.currency,
      exchange: normInfo.exchange,
      dataSource: 'error',
      timestamp: new Date().toISOString(),
      error: `Unable to fetch stock data for ${symbol}: ${liveError.message}`,
    };
  }
};

/**
 * Fetch Historical Time Series Chart Data
 */
exports.getHistoricalData = async (symbol, range = '1M') => {
  const normInfo = normalizeSymbol(symbol);
  const cacheKey = normInfo.normalizedSymbol;

  // Check cache
  const cached = cacheService.getHistory(cacheKey, range);
  if (cached && cached.isFresh) {
    return cached.data;
  }

  // Fetch from provider
  const history = await marketDataProvider.fetchHistoricalData(normInfo, range);
  if (history && history.length > 0) {
    cacheService.setHistory(cacheKey, range, history);
    return history;
  }

  // If cached data exists (even stale)
  if (cached && cached.data) {
    return cached.data;
  }

  return [];
};

/**
 * Search Stocks with caching and fallback
 */
exports.searchStocksService = async (query) => {
  if (!query || query.trim() === '') return [];

  const cleanQuery = query.trim();

  // Check cache
  const cachedResults = cacheService.getSearch(cleanQuery);
  if (cachedResults) return cachedResults;

  let results = await marketDataProvider.searchSymbols(cleanQuery);

  // Fallback / merge with local popular stock directory
  if (!results || results.length === 0) {
    const q = cleanQuery.toUpperCase();
    const localPopular = [
      { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ', region: 'United States', currency: 'USD' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ', region: 'United States', currency: 'USD' },
      { symbol: 'GOOGL', name: 'Alphabet Inc. (Google)', exchange: 'NASDAQ', region: 'United States', currency: 'USD' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ', region: 'United States', currency: 'USD' },
      { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ', region: 'United States', currency: 'USD' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ', region: 'United States', currency: 'USD' },
      { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ', region: 'United States', currency: 'USD' },
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', exchange: 'NSE', region: 'India', currency: 'INR' },
      { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', exchange: 'NSE', region: 'India', currency: 'INR' },
      { symbol: 'INFY', name: 'Infosys Ltd.', exchange: 'NSE', region: 'India', currency: 'INR' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', exchange: 'NSE', region: 'India', currency: 'INR' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', exchange: 'NSE', region: 'India', currency: 'INR' },
      { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', exchange: 'NSE', region: 'India', currency: 'INR' },
      { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', region: 'India', currency: 'INR' },
      { symbol: 'WIPRO', name: 'Wipro Ltd.', exchange: 'NSE', region: 'India', currency: 'INR' },
    ];

    results = localPopular.filter(
      (s) => s.symbol.toUpperCase().includes(q) || s.name.toUpperCase().includes(q)
    );
  }

  cacheService.setSearch(cleanQuery, results);
  return results;
};