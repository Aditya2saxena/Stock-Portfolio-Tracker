import API from './axios';

export const getAlerts = () => API.get('/alerts');
export const createAlert = (data) => API.post('/alerts', data);
export const toggleAlert = (id) => API.patch(`/alerts/${id}/toggle`);
export const updateAlert = (id, data) => API.patch(`/alerts/${id}`, data);
export const deleteAlert = (id) => API.delete(`/alerts/${id}`);
