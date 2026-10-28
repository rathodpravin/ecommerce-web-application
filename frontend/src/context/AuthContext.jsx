import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AUTH_EXPIRED_EVENT, tokenStore } from '../services/api';
import { authService } from '../services/authService';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);
const MAX_TIMEOUT = 2 ** 31 - 1;

export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true while we verify a saved session
  const timer = useRef(null);

  const logout = useCallback((message) => {
    clearTimeout(timer.current);
    tokenStore.clear();
    setUser(null);
    if (typeof message === 'string') toast.info(message);
  }, [toast]);

  const scheduleExpiry = useCallback(() => {
    clearTimeout(timer.current);
    const session = tokenStore.get();
    if (!session) return;
    const ms = Math.min(session.expiresAt - Date.now(), MAX_TIMEOUT);
    timer.current = setTimeout(() => logout('Your session has expired. Please log in again.'), ms);
  }, [logout]);

  // On first load: if a token exists, ask the backend who we are (the backend is the source of truth for role).
  useEffect(() => {
    let active = true;
    if (!tokenStore.get()) {
      setLoading(false);
      return undefined;
    }
    authService.me()
      .then((me) => { if (active) { setUser(me); scheduleExpiry(); } })
      .catch(() => tokenStore.clear())
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [scheduleExpiry]);

  // Any 401 from the API means the token is no longer valid.
  useEffect(() => {
    const onExpired = () => logout('Your session has expired. Please log in again.');
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, [logout]);

  const startSession = useCallback((res) => {
    tokenStore.set(res.token, res.expiresInSeconds);
    setUser(res.user);
    scheduleExpiry();
    return res.user;
  }, [scheduleExpiry]);

  const login = useCallback(async (email, password) => startSession(await authService.login(email, password)), [startSession]);
  const register = useCallback(async (name, email, password) => startSession(await authService.register(name, email, password)), [startSession]);

  const value = useMemo(() => ({
    user, loading, login, register, logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
  }), [user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
