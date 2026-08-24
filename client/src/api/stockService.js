import API from './axios';

// Stock details fetch (price, high, low, change, etc.)
export const getStockDetails = (symbol) => API.get(`/stocks/${symbol}`);

// Stock history fetch (OHLC chart data)
export const getStockHistory = (symbol, range = '1M') =>
  API.get(`/stocks/${symbol}/history`, { params: { range } });

// Stock search (by symbol or company name)
export const searchStocks = (query) => API.get('/stocks/search', { params: { query } });
