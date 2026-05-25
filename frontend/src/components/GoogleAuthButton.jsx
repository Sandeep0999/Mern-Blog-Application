import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import API, { isSilentError } from '../api/axios';

/* ─────────────────────────────────────────────────────────────
   Google "G" Logo SVG (official brand colors)
   ───────────────────────────────────────────────────────────── */
const GoogleLogo = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      fill="#4285F4"
    />
    <path
      d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      fill="#34A853"
    />
    <path
      d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
      fill="#FBBC05"
    />
    <path
      d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"
      fill="#EA4335"
    />
  </svg>
);

/* ─────────────────────────────────────────────────────────────
   GOOGLE AUTH BUTTON
   
   Props:
   - label: string  (e.g. "Continue with Google")
   - onSuccess: optional callback after successful auth
   ───────────────────────────────────────────────────────────── */
const GoogleAuthButton = ({ label = 'Continue with Google', onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (tokenResponse) => {
    setLoading(true);
    try {
      // Exchange access_token for user info via our backend
      const { data } = await API.post('/auth/google', {
        access_token: tokenResponse.access_token,
      });

      login(data);
      toast.success(`Welcome, ${data.name}!`, { toastId: 'google-auth-success' });
      if (onSuccess) onSuccess(data);
      else navigate('/dashboard');
    } catch (error) {
      if (!isSilentError(error)) {
        const message = error.response?.data?.message || 'Google sign-in failed. Please try again.';
        toast.error(message, { toastId: 'google-auth-error' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error('Google sign-in was cancelled or failed.', { toastId: 'google-auth-error' });
  };

  const googleLogin = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: handleGoogleError,
  });

  return (
    <button
      type="button"
      onClick={() => !loading && googleLogin()}
      disabled={loading}
      className="
        group relative w-full flex items-center justify-center gap-3
        px-4 py-3 rounded-xl text-sm font-semibold
        bg-white dark:bg-gray-900
        text-gray-700 dark:text-gray-200
        border border-gray-200 dark:border-gray-700/80
        shadow-sm hover:shadow-md
        hover:border-gray-300 dark:hover:border-gray-600
        hover:bg-gray-50 dark:hover:bg-gray-800/60
        transition-all duration-200
        disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
        focus:outline-none focus:ring-2 focus:ring-blue-500/30
      "
      aria-label="Continue with Google"
    >
      {/* Subtle hover glow */}
      <span
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(66,133,244,0.04) 0%, transparent 70%)' }}
      />

      {loading ? (
        <>
          <span className="h-[18px] w-[18px] rounded-full border-2 border-blue-400/30 border-t-blue-500 animate-spin flex-shrink-0" />
          <span className="text-gray-500 dark:text-gray-400">Signing in with Google...</span>
        </>
      ) : (
        <>
          <GoogleLogo size={18} />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};

export default GoogleAuthButton;
