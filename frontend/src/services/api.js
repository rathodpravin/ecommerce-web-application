import axios from 'axios';

/*
 * TOKEN STORAGE (bearer-token strategy, because the backend returns a JWT in the JSON body):
 *  - The token is kept in sessionStorage: it survives a page refresh but is wiped when the tab closes.
 *  - Risk: any JavaScript running on the page (e.g. an XSS bug or a malicious npm package) can read it.
 *    Mitigations used here: short-lived token, no dangerouslySetInnerHTML anywhere, token never logged,
 *    token removed on logout / expiry / any 401, and the backend re-checks role on every request.
 *  - A more secure design is an HttpOnly cookie set by the backend (needs backend + CSRF changes).
 *  - The password is never stored anywhere.
 */
const STORAGE_KEY = 'shopease_session';
export const AUTH_EXPIRED_EVENT = 'auth:expired';

export const tokenStore = {
  get() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data.token || (data.expiresAt && Date.now() >= data.expiresAt)) {
        sessionStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  },
  set(token, expiresInSeconds) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ token, expiresAt: Date.now() + expiresInSeconds * 1000 }));
  },
  clear() {
    sessionStorage.removeItem(STORAGE_KEY);
  },
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const session = tokenStore.get();
  if (session) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    // A 401 on a normal call while we hold a token means it expired / is invalid.
    if (status === 401 && tokenStore.get() && !url.startsWith('/auth/')) {
      tokenStore.clear();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(error);
  }
);

/** Turns any Axios error into one friendly sentence. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (!error.response) {
    return error.code === 'ECONNABORTED'
      ? 'The server took too long to respond. Please try again.'
      : 'Cannot reach the server. Check your connection or try again later.';
  }
  const { status, data } = error.response;
  if (data?.fieldErrors && Object.keys(data.fieldErrors).length) {
    return Object.values(data.fieldErrors)[0];
  }
  if (data?.message) return data.message;
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'The requested item was not found.';
  if (status >= 500) return 'The server had a problem. Please try again later.';
  return fallback;
}

export const getFieldErrors = (error) => error?.response?.data?.fieldErrors || {};

/** Removes empty values so we don't send ?q=&category= to the backend. */
export const cleanParams = (params = {}) =>
  Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export default api;
