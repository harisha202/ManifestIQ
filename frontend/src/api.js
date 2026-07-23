import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const customKey = localStorage.getItem('gemini_api_key');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (customKey) {
      config.headers['X-Gemini-Key'] = customKey;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token Expired / Unauthorized
      localStorage.removeItem('token');
      window.location.href = '/auth?expired=true';
    } else if (error.response?.status >= 500) {
      // Server Error
      window.location.href = '/500';
    }
    return Promise.reject(error);
  }
);

export default api;
