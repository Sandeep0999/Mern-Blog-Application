import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  PenSquare,
  User,
  LogOut,
  Shield,
  Moon,
  Sun,
} from 'lucide-react';
import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ onSearch, showSearch = false }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <nav className="bg-white/95 dark:bg-gray-900/95 border-b border-gray-100 dark:border-gray-800/80 sticky top-0 z-50 backdrop-blur-md transition-colors duration-300 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to={user ? '/dashboard' : '/'}
            className="text-2xl font-sans font-black tracking-tight text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            DailyPen
          </Link>

          {/* Search Bar */}
          {showSearch && (
            <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4 sm:mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-1.5 pl-10 pr-4 border border-gray-250/70 dark:border-gray-800 rounded-full focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-700 bg-gray-50/50 dark:bg-gray-850/40 dark:text-white text-sm focus:bg-white dark:focus:bg-gray-900 transition-all placeholder-gray-400"
                />
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
              </div>
            </form>
          )}

          {/* Right Menu */}
          <div className="flex items-center space-x-3.5">
            {/* 🌙☀️ THEME TOGGLE — STEP 4 (3) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4.5 w-4.5 text-yellow-400" />
              ) : (
                <Moon className="h-4.5 w-4.5 text-gray-650 dark:text-gray-300" />
              )}
            </button>

            {user ? (
              <>
                <Link
                  to="/create-post"
                  className="flex items-center space-x-1.5 border border-gray-200 dark:border-gray-750 hover:bg-gray-50 dark:hover:bg-gray-800/80 px-4 py-1.5 rounded-full text-xs font-semibold text-gray-700 dark:text-gray-250 transition-colors shadow-sm"
                >
                  <PenSquare className="h-4 w-4" />
                  <span className="hidden sm:inline">Write</span>
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-2 rounded-lg transition-colors"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:inline font-medium dark:text-white">
                      {user.name}
                    </span>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg py-1 border border-gray-200 dark:border-gray-700">
                      <Link
                        to={`/profile/${user._id}`}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <User className="h-4 w-4" />
                        <span>Profile</span>
                      </Link>

                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <Shield className="h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      )}

                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          handleLogout();
                        }}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors w-full text-left text-red-600"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="bg-gray-900 text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
