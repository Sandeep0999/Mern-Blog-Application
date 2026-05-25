import axios from 'axios';
import { toast } from 'react-toastify';

/* ─────────────────────────────────────────────────────────────
   SENTINEL ERROR — thrown when a 401 is fully handled here.
   Component catch blocks can detect this and stay silent.
   ───────────────────────────────────────────────────────────── */
export class AuthError extends Error {
  constructor(message = 'Session expired') {
    super(message);
    this.name = 'AuthError';
    this.isAuthError = true;
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network connection lost') {
    super(message);
    this.name = 'NetworkError';
    this.isNetworkError = true;
  }
}

/** Returns true when the error was a handled 401 logout */
export const isAuthError = (err) =>
  err?.isAuthError === true || err?.name === 'AuthError';

/** Returns true when the request was intentionally cancelled */
export const isAbortError = (err) =>
  err?.name === 'AbortError' || err?.name === 'CanceledError' || axios.isCancel(err);

/** Returns true when the error is a centralized network outage failure */
export const isNetworkError = (err) =>
  err?.isNetworkError === true || err?.name === 'NetworkError';

/** Returns true for any error that components should silently ignore */
export const isSilentError = (err) =>
  isAuthError(err) || isAbortError(err) || isNetworkError(err);

// ── STRUCTURED DEBUGGING INSTRUMENTATION ──
export const logDebug = (tag, ...args) => {
  if (import.meta.env.DEV) {
    console.log(`%c[DailyPen ${tag}]`, 'color: #0ea5e9; font-weight: bold;', ...args);
  }
};

/* ─────────────────────────────────────────────────────────────
   GLOBAL LOGOUT LOCK
   Prevents multiple 401 responses from each firing their own
   toast + redirect when several requests fail simultaneously.
   ───────────────────────────────────────────────────────────── */
let _loggingOut = false;

export const resetLogoutState = () => { _loggingOut = false; };

/* ─────────────────────────────────────────────────────────────
   AXIOS INSTANCE
   ───────────────────────────────────────────────────────────── */
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000, // 15-second request timeout to prevent hanging requests
});

/* ─────────────────────────────────────────────────────────────
   REQUEST INTERCEPTOR — attach token
   ───────────────────────────────────────────────────────────── */
API.interceptors.request.use(
  (config) => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const user = JSON.parse(raw);
        if (user?.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
          logDebug('Auth', `Attached Bearer token to request: ${config.url}`);
        }
      }
    } catch (e) {
      logDebug('Auth', 'Failed to parse user from localStorage in request interceptor', e);
    }
    logDebug('Request', `[INIT] ${config.method?.toUpperCase()} -> ${config.url}`);
    return config;
  },
  (error) => {
    logDebug('Request', 'Request configuration error', error);
    return Promise.reject(error);
  }
);

/* ─────────────────────────────────────────────────────────────
   RESPONSE INTERCEPTOR — centralized error handling
   ───────────────────────────────────────────────────────────── */
API.interceptors.response.use(
  (response) => {
    logDebug('Response', `[SUCCESS] ${response.status} <- ${response.config.url}`);
    return response;
  },
  (error) => {
    // ── Cancelled / aborted requests — completely silent ──
    if (isAbortError(error)) {
      logDebug('Request', `[ABORTED] Request to ${error.config?.url || 'unknown'} was canceled.`);
      return Promise.reject(error);
    }

    const status = error.response?.status;
    logDebug('Response', `[FAILED] Status: ${status || 'Network Error'} <- ${error.config?.url || 'unknown'}`);

    // ── 401 Unauthorized ──
    if (status === 401) {
      if (_loggingOut) {
        logDebug('Auth', 'Absorbed concurrent 401 request during active redirect, silencing.');
        return Promise.reject(new AuthError());
      }

      const hasSession = !!localStorage.getItem('user');
      if (hasSession) {
        _loggingOut = true;
        logDebug('Auth', '401 Unauthorized detected with active session. Clearing storage and initiating redirect...');
        localStorage.removeItem('user');
        
        toast.error('Your session has expired. Please log in again.', {
          toastId: 'session-expired',
          autoClose: 3000,
        });
        
        setTimeout(() => {
          window.location.href = '/login';
        }, 800);
        
        return Promise.reject(new AuthError());
      }
      return Promise.reject(error);
    }

    // ── Network error (no response) ──
    if (!error.response) {
      logDebug('Network', 'No response received. Displaying centralized network outage alert.');
      toast.error('Network error — please check your connection.', {
        toastId: 'network-error',
        autoClose: 4000,
      });
      return Promise.reject(new NetworkError());
    }

    // ── All other errors — propagate to component ──
    return Promise.reject(error);
  }
);

export default API;