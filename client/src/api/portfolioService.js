import API from './axios';

// Poora portfolio fetch karo (live price + P/L ke saath)
export const getPortfolio = () => API.get('/portfolio');

// Naya stock portfolio mein add karo
export const addStock = (data) => API.post('/portfolio', data);

// Stock delete karo portfolio se
export const deleteStock = (id) => API.delete(`/portfolio/${id}`);

// Portfolio value ka snapshot save karo (chart history ke liye)
export const saveSnapshot = (data) => API.post('/portfolio/snapshot', data);

// Snapshot history fetch karo (page load pe chart restore karne ke liye)
export const getSnapshotHistory = () => API.get('/portfolio/history');