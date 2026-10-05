import axios from 'axios';

const apiHost = (process.env.REACT_APP_API_URL || 'http://localhost:5000')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

const API = axios.create({
  baseURL: `${apiHost}/api`,
  timeout: 15000,
});

// Attach JWT token automatically to every request if available
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// A saved user without a valid JWT would otherwise keep protected screens open
// while every API request fails with 401.
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default API;
