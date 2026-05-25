import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { UserPlus, ArrowLeft } from 'lucide-react';
import GoogleAuthButton from '../components/GoogleAuthButton';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 transition-colors duration-300 relative overflow-hidden px-4 py-12">
      {/* Background Decorative Glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-gray-900/5 dark:bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gray-900/5 dark:bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

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
            Start your long-form writing journey today.
          </p>
        </div>

        {/* Card Form Wrapper */}
        <div className="bg-white dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800/80 shadow-xl dark:shadow-black/45 rounded-2xl p-8 backdrop-blur-md">
          <div className="flex items-center justify-center mb-5">
            <div className="p-3 bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 rounded-full shadow-sm">
              <UserPlus className="h-5 w-5" />
            </div>
          </div>

          <h2 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-6">
            Create your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="John Doe"
                className="w-full px-4 py-3 text-sm border border-gray-250/70 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/40 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-all placeholder-gray-400"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@domain.com"
                className="w-full px-4 py-3 text-sm border border-gray-250/70 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/40 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-all placeholder-gray-400"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 text-sm border border-gray-250/70 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/40 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-all placeholder-gray-400"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 text-sm border border-gray-250/70 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-850/40 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 transition-all placeholder-gray-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gray-900 dark:bg-gray-100 hover:bg-gray-850 dark:hover:bg-white text-white dark:text-gray-950 py-3 rounded-xl font-bold text-sm shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating your account...' : 'Create Account'}
            </button>
          </form>

          {/* Google Sign-Up */}
          <div className="mt-5">
            <div className="relative flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
              <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-600 uppercase tracking-widest flex-shrink-0">or</span>
              <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
            </div>
            <GoogleAuthButton label="Sign up with Google" />
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Already registered?{' '}
              <Link
                to="/login"
                className="text-gray-900 dark:text-white font-bold hover:underline"
              >
                Login here
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

export default Signup;