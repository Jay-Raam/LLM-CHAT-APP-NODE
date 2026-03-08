import axios from 'axios';
import { API_BASE_URL, AUTH_TOKEN_KEY } from '../constants';
import { store } from '../store';
import { logout } from '../store/authSlice';

const api = axios.create({
  baseURL: API_BASE_URL || 'http://localhost:4000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token && token !== 'null' && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (config.headers && 'Authorization' in config.headers) {
    delete (config.headers as any).Authorization;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      const refreshUrl = `${API_BASE_URL.replace(/\/$/, '')}/auth/refresh`;
      try {
        const res = await fetch(refreshUrl, { method: 'POST', credentials: 'include' });
        if (res.ok) {
          return api(originalRequest);
        }
      } catch (e) {
        console.warn('Refresh request failed', e);
      }
      try { store.dispatch(logout()); } catch (e) {}
      try { localStorage.removeItem(AUTH_TOKEN_KEY); } catch (e) {}
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// GraphQL helper
const GRAPHQL_URL = (import.meta as any).env?.VITE_GRAPHQL_URL || `${API_BASE_URL.replace(/\/$/, '')}/graphql`;

export const sendMessage = async (text: string) => {
  const query = `mutation SendMessage($text: String!) { sendMessage(text: $text) { id text sender createdAt } }`;
  const res = await api.post(GRAPHQL_URL, { query, variables: { text } });
  return res.data;
};

export default api;
