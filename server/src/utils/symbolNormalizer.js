const KNOWN_INDIAN_STOCKS = new Set([
  'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'TATAMOTORS', 
  'SBIN', 'WIPRO', 'BHARTIARTL', 'LT', 'HINDUNILVR', 'ITC', 'AXISBANK',
  'KOTAKBANK', 'MARUTI', 'SUNPHARMA', 'TITAN', 'ULTRACEMCO', 'BAJFINANCE',
  'ASIANPAINT', 'NTPC', 'POWERGRID', 'ONGC', 'M&M', 'ADANIENT', 'COALINDIA'
]);

// Mapping for ticker symbols that underwent restructuring/symbol changes on Yahoo Finance
const SYMBOL_ALIASES = {
  'TATAMOTORS': 'TMPV.NS',
  'TATAMOTORS.NS': 'TMPV.NS',
  'TATAMOTORS:NSE': 'TMPV.NS',
};

/**
 * Normalizes user input stock symbols into provider-friendly and display formats.
 * e.g. TCS:NSE -> TCS.NS
 *      TCS -> TCS.NS (for Indian stocks)
 *      AAPL -> AAPL
 */
function normalizeSymbol(symbolInput) {
  if (!symbolInput || typeof symbolInput !== 'string') {
    return {
      rawSymbol: '',
      normalizedSymbol: '',
      displaySymbol: '',
      market: 'UNKNOWN',
      currency: 'USD',
      exchange: 'US',
    };
  }

  let clean = symbolInput.trim().toUpperCase();
  clean = clean.replace(':NSE', '.NS').replace(':BSE', '.BSE');

  let normalizedSymbol = clean;
  let displaySymbol = clean;
  let market = 'US';
  let currency = 'USD';
  let exchange = 'US';

  // Apply symbol alias override if present
  if (SYMBOL_ALIASES[clean]) {
    normalizedSymbol = SYMBOL_ALIASES[clean];
    displaySymbol = clean.replace('.NS', '').replace(':NSE', '');
    market = 'NSE';
    currency = 'INR';
    exchange = 'NSE';
    return {
      rawSymbol: symbolInput,
      normalizedSymbol,
      displaySymbol,
      market,
      currency,
      exchange,
    };
  }

  if (clean.endsWith('.NS')) {
    market = 'NSE';
    currency = 'INR';
    exchange = 'NSE';
    displaySymbol = clean.replace('.NS', '');
  } else if (clean.endsWith('.BSE')) {
    market = 'BSE';
    currency = 'INR';
    exchange = 'BSE';
    displaySymbol = clean.replace('.BSE', '');
  } else if (KNOWN_INDIAN_STOCKS.has(clean)) {
    market = 'NSE';
    currency = 'INR';
    exchange = 'NSE';
    normalizedSymbol = `${clean}.NS`;
    displaySymbol = clean;
  } else if (clean.endsWith('.BO') || clean.endsWith('.NS')) {
    market = 'NSE';
    currency = 'INR';
    exchange = 'NSE';
  } else {
    // US Stock defaults
    market = 'US';
    currency = 'USD';
    exchange = 'US';
    displaySymbol = clean;
  }

  return {
    rawSymbol: symbolInput,
    normalizedSymbol,
    displaySymbol,
    market,
    currency,
    exchange,
  };
}

module.exports = {
  normalizeSymbol,
  KNOWN_INDIAN_STOCKS,
  SYMBOL_ALIASES,
};
