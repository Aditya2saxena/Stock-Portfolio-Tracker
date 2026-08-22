import API from './axios';

// Poori watchlist fetch karo (live price ke saath)
export const getWatchlist = () => API.get('/watchlist');

// Naya stock watchlist mein add karo
export const addToWatchlist = (data) => API.post('/watchlist', data);

// Stock remove karo watchlist se
export const removeFromWatchlist = (symbol) => API.delete(`/watchlist/${symbol}`);