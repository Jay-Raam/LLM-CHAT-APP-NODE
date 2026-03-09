import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthState, User } from '../types';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '../constants';

function loadUserFromStorage(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch (e) {
    console.warn('Failed to parse stored user', e);
    return null;
  }
}

function loadTokenFromStorage(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!raw || raw === 'null' || raw === 'undefined') return null;
    return raw;
  } catch (e) {
    return null;
  }
}

const persistedToken = loadTokenFromStorage();
const persistedUser = loadUserFromStorage();

const initialState: AuthState = {
  user: persistedUser,
  token: persistedToken,
  isAuthenticated: !!(persistedToken || persistedUser),
  loading: false,
  error: null,
  initialized: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setInitialized: (state, action: PayloadAction<boolean>) => {
      state.initialized = action.payload;
    },
    setAuth: (state, action: PayloadAction<{ user: User | null; token: string | null }>) => {
      state.user = action.payload.user ?? null;
      state.token = action.payload.token;
      state.isAuthenticated = !!(state.user || state.token);
      state.loading = false;
      state.error = null;
      try {
        if (action.payload.token) {
          localStorage.setItem(AUTH_TOKEN_KEY, action.payload.token);
        } else {
          localStorage.removeItem(AUTH_TOKEN_KEY);
        }
        if (action.payload.user) {
          localStorage.setItem(AUTH_USER_KEY, JSON.stringify(action.payload.user));
        } else {
          localStorage.removeItem(AUTH_USER_KEY);
        }
      } catch (e) {
        console.warn('Failed to persist auth to localStorage', e);
      }
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.loading = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      try {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      } catch (e) {
        console.warn('Failed to clear auth from localStorage', e);
      }
    },
  },
});

export const { setLoading, setAuth, setError, logout } = authSlice.actions;
export const { setInitialized } = authSlice.actions;
export default authSlice.reducer;
