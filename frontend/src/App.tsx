import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { useAppSelector } from './hooks/useRedux';
import { API_BASE_URL } from './constants';
import { setAuth, setInitialized } from './store/authSlice';
import Login from './pages/Login';
import Register from './pages/Register';
import MainLayout from './layouts/MainLayout';
import { JSX, useEffect } from 'react';
import Dashboard from './pages/Dashboard';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated, initialized } = useAppSelector((s) => s.auth);
  if (!initialized) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 selection:bg-indigo-500/30">
          <AuthLoader />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </Provider>
  );
}

function AuthLoader() {
  const dispatch = store.dispatch;
  useEffect(() => {
    (async () => {
      try {
        // If already authenticated, nothing to do
        const state = store.getState();
        // Always validate server-side session (in case cookies were cleared externally)
        const base = (import.meta as any).env?.VITE_API_BASE_URL ? (import.meta as any).env?.VITE_API_BASE_URL.replace(/\/$/, '') : API_BASE_URL.replace(/\/$/, '');

        // First try to read /auth/me
        let res = await fetch(`${base}/auth/me`, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.ok && data.user) {
            dispatch(setAuth({ user: data.user, token: null }));
            return;
          }
        }

        // If /auth/me failed (likely 401), try refresh (rotation) then re-check /auth/me
        const refreshRes = await fetch(`${base}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (refreshRes.ok) {
          res = await fetch(`${base}/auth/me`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.ok && data.user) {
              dispatch(setAuth({ user: data.user, token: null }));
              return;
            }
          }
        }

        // If we reach here authentication failed: clear local state and storage
        // dispatch(logout());
        try { localStorage.removeItem('nexus_auth_token'); localStorage.removeItem('nexus_auth_user'); } catch (e) { }
      } catch (e) {
        // ignore — user will remain unauthenticated
      } finally {
        // mark initialization complete regardless of auth outcome so RequireAuth can act
        dispatch(setInitialized(true));
      }
    })();
  }, []);
  return null;
}
