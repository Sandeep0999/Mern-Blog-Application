import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { LogIn, ShieldCheck } from 'lucide-react';
import API from '../api/axios';

const Login = () => {
  const [step, setStep] = useState('login'); // login | otp
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false); // ✅ NEW

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { setUser } = useAuth();
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
      toast.success('OTP sent to your email');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
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

      // Save auth
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);

      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="text-4xl font-display font-bold text-gray-900">
            DailyPen
          </Link>
          <p className="mt-2 text-gray-600">
            {step === 'login'
              ? 'Welcome back! Please login to your account.'
              : 'Enter the OTP sent to your email'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-gray-900 rounded-full">
              {step === 'login' ? (
                <LogIn className="h-6 w-6 text-white" />
              ) : (
                <ShieldCheck className="h-6 w-6 text-white" />
              )}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
            {step === 'login' ? 'Login to your account' : 'Verify OTP'}
          </h2>

          {/* LOGIN FORM */}
          {step === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 border rounded-lg"
              />

              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 border rounded-lg"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 text-white py-3 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Sending OTP...' : 'Login'}
              </button>
            </form>
          )}

          {/* OTP FORM */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <input
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                }
                maxLength={6}
                placeholder="123456"
                className="w-full px-4 py-3 text-center tracking-widest text-lg border rounded-lg"
              />

              <button
                type="submit"
                disabled={loading || otpVerified}
                className="w-full bg-gray-900 text-white py-3 rounded-lg disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('login');
                  setOtp('');
                  setOtpVerified(false);
                }}
                className="w-full text-sm text-gray-600 hover:underline"
              >
                ← Back to login
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-gray-600 hover:text-gray-900">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
