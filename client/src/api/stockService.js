import API from './axios';

// Stock details fetch (price, high, low, change, etc.)
export const getStockDetails = (symbol) => API.get(`/stocks/${symbol}`);

// Stock search (by symbol or company name)
export const searchStocks = (query) => API.get('/stocks/search', { params: { query } });
