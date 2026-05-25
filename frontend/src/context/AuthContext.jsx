import { createContext, useState, useEffect, useContext } from 'react';
import API, { resetLogoutState } from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/* ─────────────────────────────────────────────────────────────
   AUTH PROVIDER
   ───────────────────────────────────────────────────────────── */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session from localStorage on app start ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const stored = JSON.parse(raw);
        // Basic sanity check — must have a token string
        if (stored && typeof stored.token === 'string' && stored.token.length > 10) {
          setUser(stored);
        } else {
          // Corrupted or empty token — clear it silently
          localStorage.removeItem('user');
        }
      }
    } catch {
      // Corrupted JSON in localStorage — clear it
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Login (email + password → OTP flow; stores result of verify-otp) ── */
  const login = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    resetLogoutState(); // reset any previous logout lock
    setUser(userData);
  };

  /* ── Register ── */
  const register = async (name, email, password) => {
    const { data } = await API.post('/auth/register', { name, email, password });
    localStorage.setItem('user', JSON.stringify(data));
    resetLogoutState();
    setUser(data);
    return data;
  };

  /* ── Logout ── */
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  /* ── Update profile (keeps token intact) ── */
  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    setUser,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
