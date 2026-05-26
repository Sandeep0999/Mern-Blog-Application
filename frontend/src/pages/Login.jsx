import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { LogIn, ShieldCheck, ArrowLeft } from 'lucide-react';
import API from '../api/axios';
import GoogleAuthButton from '../components/GoogleAuthButton';

const Login = () => {
  const [step, setStep] = useState('login');
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const { data } = await API.post('/auth/login', formData);

      setUserId(data.userId);
      setStep('otp');
      toast.success('OTP sent to your email', { toastId: 'otp-sent' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed', { toastId: 'login-error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    if (loading || otpVerified) return;
    if (!userId || otp.length !== 6) {
      toast.error('Invalid OTP');
      return;
    }

    setLoading(true);

    try {
      const { data } = await API.post('/auth/verify-otp', {
        userId,
        otp: otp.trim(),
      });

      setOtpVerified(true);

      // Save auth via context (handles localStorage + resetLogoutState)
      login(data);

      toast.success('Login successful!', { toastId: 'login-success' });
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP', { toastId: 'otp-error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0c0e14] transition-colors duration-300 relative overflow-hidden px-4">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-amber-400/5 dark:bg-amber-400/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-400/5 dark:bg-violet-400/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 space-y-6">
        
        {/* Top Header / Brand */}
        <div className="text-center">
          <Link 
            to="/" 
            className="text-3xl font-sans font-black tracking-tight text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            DailyPen
          </Link>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {step === 'login'
              ? 'Welcome back. Please login to continue.'
              : 'Enter the verification code sent to your inbox.'}
          </p>
        </div>

        {/* Card Form Wrapper */}
        <div className="bg-white dark:bg-[#111318] border border-gray-100 dark:border-white/[0.06] shadow-xl dark:shadow-black/60 rounded-2xl p-8 backdrop-blur-md">
          <div className="flex items-center justify-center mb-5">
            <div className="p-3 bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 rounded-full shadow-sm">
              {step === 'login' ? (
                <LogIn className="h-5 w-5" />
              ) : (
                <ShieldCheck className="h-5 w-5" />
              )}
            </div>
          </div>

          <h2 className="text-lg font-bold text-center text-gray-900 dark:text-[#f0f2f8] mb-6">
            {step === 'login' ? 'Login to your account' : 'Verify OTP'}
          </h2>

          {/* LOGIN FORM */}
          {step === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-[#555d74] uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="name@domain.com"
                  className="dp-input"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-[#555d74] uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="dp-input"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2
                           bg-gray-900 dark:bg-amber-500
                           hover:bg-gray-800 dark:hover:bg-amber-400
                           text-white
                           py-3 rounded-xl font-bold text-sm
                           shadow-sm transition-all duration-200
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending verification OTP...' : 'Login'}
              </button>
            </form>
          )}

          {/* OTP FORM */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 dark:text-[#555d74] uppercase tracking-wider mb-1.5 text-center">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  maxLength={6}
                  placeholder="000 000"
                  className="dp-input text-center tracking-[0.4em] font-bold text-lg"
                />
              </div>

              <button
                type="submit"
                disabled={loading || otpVerified}
                className="w-full
                           bg-gray-900 dark:bg-amber-500
                           hover:bg-gray-800 dark:hover:bg-amber-400
                           text-white
                           py-3 rounded-xl font-bold text-sm
                           shadow-sm transition-all duration-200
                           disabled:opacity-40"
              >
                {loading ? 'Verifying OTP code...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('login');
                  setOtp('');
                  setOtpVerified(false);
                }}
                className="w-full text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:underline pt-2 font-medium"
              >
                ← Back to login
              </button>
            </form>
          )}

          {/* Google Sign-In — only shown on the login step */}
          {step === 'login' && (
            <div className="mt-5">
              {/* OR divider */}
              <div className="relative flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest flex-shrink-0">or</span>
                <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              </div>
              <GoogleAuthButton label="Continue with Google" />
            </div>
          )}

          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/[0.05] text-center">
            <p className="text-xs text-gray-400 dark:text-[#555d74]">
              New to DailyPen?{' '}
              <Link
                to="/signup"
                className="text-gray-900 dark:text-amber-400 font-bold hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Navigation Back */}
        <div className="text-center">
          <Link 
            to="/" 
            className="inline-flex items-center space-x-1.5 text-xs text-gray-550 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default Login;
