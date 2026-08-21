import API from './axios';

// Poora portfolio fetch karo (live price + P/L ke saath)
export const getPortfolio = () => API.get('/portfolio');

// Naya stock portfolio mein add karo
export const addStock = (data) => API.post('/portfolio', data);

// Stock delete karo portfolio se
export const deleteStock = (id) => API.delete(`/portfolio/${id}`);