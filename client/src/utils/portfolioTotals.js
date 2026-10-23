export const getPortfolioTotalsByCurrency = (portfolio = []) => {
  const totals = {};
  portfolio.forEach((item) => {
    const currency = item.currency || (item.stockSymbol?.endsWith('.NS') ? 'INR' : 'USD');
    const bucket = totals[currency] || { investment: 0, currentValue: 0, profitLoss: 0, pricedInvestment: 0 };
    const investment = Number(item.investment ?? (Number(item.buyPrice || 0) * Number(item.quantity || 0)));
    bucket.investment += investment;
    if (item.currentValue !== null && item.currentValue !== undefined && Number.isFinite(Number(item.currentValue))) {
      const currentValue = Number(item.currentValue);
      bucket.currentValue += currentValue;
      bucket.profitLoss += currentValue - investment;
      bucket.pricedInvestment += investment;
    }
    totals[currency] = bucket;
  });
  return totals;
};

export const getCurrencySymbol = (currency) => ({ INR: '₹', USD: '$' }[currency] || `${currency} `);

const KNOWN_INDIAN_SYMBOLS = new Set([
  'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'TATAMOTORS', 'SBIN', 'WIPRO',
  'BHARTIARTL', 'LT', 'HINDUNILVR', 'ITC', 'AXISBANK', 'KOTAKBANK', 'MARUTI',
  'SUNPHARMA', 'TITAN', 'ULTRACEMCO', 'BAJFINANCE', 'ASIANPAINT', 'NTPC', 'POWERGRID',
  'ONGC', 'M&M', 'ADANIENT', 'COALINDIA',
]);

export const isIndianSymbol = (symbol = '') => {
  const normalized = String(symbol).toUpperCase().trim();
  return /\.(NS|BO|BSE)$/.test(normalized) || normalized.endsWith(':NSE') || normalized.endsWith(':BSE') || KNOWN_INDIAN_SYMBOLS.has(normalized);
};
