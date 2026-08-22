import API from './axios';

// Get transaction history
export const getTransactions = (params) => API.get('/transactions', { params });

// Execute BUY or SELL transaction
export const createTransaction = (data) => API.post('/transactions', data);

// Delete transaction
export const deleteTransaction = (id) => API.delete(`/transactions/${id}`);
