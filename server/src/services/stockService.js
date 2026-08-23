const axios = require('axios');
const ALPHA_VANTAGE_URL = 'https://www.alphavantage.co/query';

// Cache: 5 minutes TTL
const CACHE_TTL_MS = 5 * 60 * 1000;
const priceCache = {};

// Popular stock master directory for search matching & fallback
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', region: 'United States', currency: 'USD' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', region: 'United States', currency: 'USD' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Google)', region: 'United States', currency: 'USD' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', region: 'United States', currency: 'USD' },
  { symbol: 'TSLA', name: 'Tesla Inc.', region: 'United States', currency: 'USD' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', region: 'United States', currency: 'USD' },
  { symbol: 'META', name: 'Meta Platforms Inc.', region: 'United States', currency: 'USD' },
  { symbol: 'NFLX', name: 'Netflix Inc.', region: 'United States', currency: 'USD' },
  { symbol: 'AMD', name: 'Advanced Micro Devices Inc.', region: 'United States', currency: 'USD' },
  { symbol: 'DIS', name: 'The Walt Disney Company', region: 'United States', currency: 'USD' },
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', region: 'India (NSE)', currency: 'INR' },
  { symbol: 'INFY', name: 'Infosys Ltd.', region: 'India (NSE)', currency: 'INR' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', region: 'India (NSE)', currency: 'INR' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', region: 'India (NSE)', currency: 'INR' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', region: 'India (NSE)', currency: 'INR' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', region: 'India (NSE)', currency: 'INR' },
  { symbol: 'WIPRO', name: 'Wipro Ltd.', region: 'India (NSE)', currency: 'INR' },
  { symbol: 'SBIN', name: 'State Bank of India', region: 'India (NSE)', currency: 'INR' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', region: 'India (NSE)', currency: 'INR' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd.', region: 'India (NSE)', currency: 'INR' },
];

const demoPrices = {
  'AAPL': { currentPrice: 227.50, change: 1.20, percentChange: 0.53, high: 228.10, low: 225.30, open: 226.00, previousClose: 226.30, name: 'Apple Inc.' },
  'MSFT': { currentPrice: 420.50, change: 2.30, percentChange: 0.55, high: 422.00, low: 418.00, open: 419.00, previousClose: 418.20, name: 'Microsoft Corporation' },
  'GOOGL': { currentPrice: 175.40, change: -1.10, percentChange: -0.62, high: 177.20, low: 174.50, open: 176.50, previousClose: 176.50, name: 'Alphabet Inc.' },
  'AMZN': { currentPrice: 186.20, change: 3.40, percentChange: 1.86, high: 187.50, low: 183.10, open: 184.00, previousClose: 182.80, name: 'Amazon.com Inc.' },
  'TSLA': { currentPrice: 245.80, change: -3.40, percentChange: -1.36, high: 250.20, low: 244.10, open: 249.00, previousClose: 249.20, name: 'Tesla Inc.' },
  'RELIANCE': { currentPrice: 1315.55, change: 12.30, percentChange: 0.94, high: 1320.00, low: 1305.00, open: 1310.00, previousClose: 1303.25, name: 'Reliance Industries Ltd.' },
  'RELIANCE.NS': { currentPrice: 1315.55, change: 12.30, percentChange: 0.94, high: 1320.00, low: 1305.00, open: 1310.00, previousClose: 1303.25, name: 'Reliance Industries Ltd.' },
  'TCS': { currentPrice: 3200.40, change: -8.20, percentChange: -0.26, high: 3215.00, low: 3190.00, open: 3210.00, previousClose: 3208.60, name: 'Tata Consultancy Services Ltd.' },
  'TCS.NS': { currentPrice: 3200.40, change: -8.20, percentChange: -0.26, high: 3215.00, low: 3190.00, open: 3210.00, previousClose: 3208.60, name: 'Tata Consultancy Services Ltd.' },
  'INFY': { currentPrice: 1520.25, change: 5.10, percentChange: 0.34, high: 1525.00, low: 1512.00, open: 1515.00, previousClose: 1515.15, name: 'Infosys Ltd.' },
  'INFY.NS': { currentPrice: 1520.25, change: 5.10, percentChange: 0.34, high: 1525.00, low: 1512.00, open: 1515.00, previousClose: 1515.15, name: 'Infosys Ltd.' },
  'NVDA': { currentPrice: 128.50, change: 4.20, percentChange: 3.38, high: 129.80, low: 125.10, open: 126.00, previousClose: 124.30, name: 'NVIDIA Corporation' },
  'META': { currentPrice: 485.10, change: -2.30, percentChange: -0.47, high: 490.00, low: 482.00, open: 488.00, previousClose: 487.40, name: 'Meta Platforms Inc.' },
};

const normalizeSymbol = (symbol) => {
  let cleanSymbol = symbol.toUpperCase().trim();
  cleanSymbol = cleanSymbol.replace(':NSE', '.NS').replace(':BSE', '.BSE');
  return cleanSymbol;
};

const findMatchingKey = (store, symbol) => {
  if (store[symbol]) return symbol;
  if (store[`${symbol}.NS`]) return `${symbol}.NS`;
  if (store[`${symbol}.BSE`]) return `${symbol}.BSE`;
  const clean = symbol.replace('.NS', '').replace('.BSE', '');
  if (store[clean]) return clean;
  return null;
};

const fetchLiveData = async (symbol) => {
  const response = await axios.get(ALPHA_VANTAGE_URL, {
    params: {
      function: 'GLOBAL_QUOTE',
      symbol,
      apikey: process.env.ALPHA_VANTAGE_API_KEY,
    },
  });

  console.log(
  `🔎 Alpha Vantage response for ${symbol}:`,
  JSON.stringify(response.data)
);

const quote = response.data['Global Quote'];

if (!quote || !quote['05. price']) {
  throw new Error(
    response.data.Note ||
    response.data.Information ||
    response.data['Error Message'] ||
    'No live data available'
  );
}

  // Retrieve matching metadata name if known
  const foundStock = POPULAR_STOCKS.find((s) => s.symbol === symbol || `${s.symbol}.NS` === symbol);

  return {
    symbol: quote['01. symbol'],
    name: foundStock ? foundStock.name : quote['01. symbol'],
    currentPrice: parseFloat(quote['05. price']),
    change: parseFloat(quote['09. change']),
    percentChange: parseFloat(quote['10. change percent'].replace('%', '')),
    high: parseFloat(quote['03. high']),
    low: parseFloat(quote['04. low']),
    open: parseFloat(quote['02. open']),
    previousClose: parseFloat(quote['08. previous close']),
    volume: parseInt(quote['06. volume'], 10),
    latestTradingDay: quote['07. latest trading day'],
  };
};

exports.getStockPrice = async (symbol) => {
  const alphaVantageSymbol = normalizeSymbol(symbol);

  // STEP 1: Check fresh cache
  const cached = priceCache[alphaVantageSymbol];
  if (cached) {
    const age = Date.now() - cached.timestamp.getTime();
    if (age < CACHE_TTL_MS) {
      return { ...cached.data, dataSource: 'live' };
    }
  }

  // STEP 2: Try live API
  try {
    const liveData = await fetchLiveData(alphaVantageSymbol);
    priceCache[alphaVantageSymbol] = { data: liveData, timestamp: new Date() };
    return { ...liveData, dataSource: 'live' };
  } catch (liveError) {
    console.warn(`⚠️ Live API failed for ${alphaVantageSymbol}: ${liveError.message}`);

    // STEP 3: Check stale cache
    const cacheKey = findMatchingKey(priceCache, alphaVantageSymbol);
    if (cacheKey) {
      const staleCache = priceCache[cacheKey];
      return { ...staleCache.data, dataSource: 'cached', lastUpdated: staleCache.timestamp };
    }

    // STEP 4: Demo fallback
    const demoKey = findMatchingKey(demoPrices, alphaVantageSymbol);
    if (demoKey) {
      const foundStock = POPULAR_STOCKS.find((s) => s.symbol === alphaVantageSymbol || `${s.symbol}.NS` === alphaVantageSymbol);
      return {
        symbol: alphaVantageSymbol,
        name: foundStock ? foundStock.name : demoPrices[demoKey].name || alphaVantageSymbol,
        ...demoPrices[demoKey],
        dataSource: 'demo',
      };
    }

    // Generate fallback for dynamic symbols to prevent breaking UI
    const foundPopular = POPULAR_STOCKS.find((s) => s.symbol === alphaVantageSymbol || s.symbol.startsWith(alphaVantageSymbol));
    if (foundPopular) {
      return {
        symbol: alphaVantageSymbol,
        name: foundPopular.name,
        currentPrice: 150.00,
        change: 1.50,
        percentChange: 1.00,
        high: 152.00,
        low: 148.50,
        open: 149.00,
        previousClose: 148.50,
        dataSource: 'demo',
      };
    }

    throw new Error(`No data available for ${symbol} (live, cache, and demo all unavailable)`);
  }
};

// Search stock service implementation
exports.searchStocksService = async (query) => {
  if (!query || query.trim() === '') return [];

  const q = query.trim().toUpperCase();

  // Filter master popular stocks directory first
  const localMatches = POPULAR_STOCKS.filter(
    (stock) => stock.symbol.toUpperCase().includes(q) || stock.name.toUpperCase().includes(q)
  );

  // Attempt Alpha Vantage symbol search if configured
  try {
    if (process.env.ALPHA_VANTAGE_API_KEY && process.env.ALPHA_VANTAGE_API_KEY !== 'demo') {
      const response = await axios.get(ALPHA_VANTAGE_URL, {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords: q,
          apikey: process.env.ALPHA_VANTAGE_API_KEY,
        },
      });

      const bestMatches = response.data.bestMatches;
      if (bestMatches && Array.isArray(bestMatches)) {
        const apiMatches = bestMatches.map((item) => ({
          symbol: item['1. symbol'],
          name: item['2. name'],
          region: item['4. region'],
          currency: item['8. currency'],
        }));

        // Merge results avoiding duplicate symbols
        const merged = [...localMatches];
        apiMatches.forEach((apiItem) => {
          if (!merged.some((m) => m.symbol === apiItem.symbol)) {
            merged.push(apiItem);
          }
        });
        return merged.slice(0, 10);
      }
    }
  } catch (err) {
    console.warn(`Search API error: ${err.message}`);
  }

  return localMatches.slice(0, 10);
};