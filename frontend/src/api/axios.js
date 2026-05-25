import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Add token to requests
API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Handle errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only force-logout if there's actually an active session.
      // This prevents redirecting guest users when public requests fail.
      const hasSession = !!localStorage.getItem('user');
      if (hasSession) {
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;