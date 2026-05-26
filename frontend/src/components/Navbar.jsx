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
    <nav className="bg-white/97 dark:bg-[#0c0e14]/97 border-b border-gray-100 dark:border-white/[0.05] sticky top-0 z-50 backdrop-blur-md transition-colors duration-300 shadow-sm dark:shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link
            to={user ? '/dashboard' : '/'}
            className="text-xl font-sans font-black tracking-tight text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-200 transition-colors flex-shrink-0"
          >
            DailyPen
          </Link>

          {/* Search Bar */}
          {showSearch && (
            <form onSubmit={handleSearch} className="flex-1 max-w-lg mx-4 sm:mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-4
                             border border-gray-200 dark:border-white/[0.07]
                             rounded-full
                             bg-gray-50 dark:bg-white/[0.05]
                             text-gray-900 dark:text-white
                             placeholder-gray-400 dark:placeholder-white/30
                             text-sm
                             focus:outline-none focus:ring-2
                             focus:ring-gray-300 dark:focus:ring-amber-500/40
                             focus:bg-white dark:focus:bg-white/[0.08]
                             transition-all duration-200"
                />
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400 dark:text-white/30" />
              </div>
            </form>
          )}

          {/* Right Menu */}
          <div className="flex items-center space-x-2 sm:space-x-3">

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-gray-500" />
              )}
            </button>

            {user ? (
              <>
                {/* Write button */}
                <Link
                  to="/create-post"
                  className="hidden sm:flex items-center space-x-1.5
                             border border-gray-200 dark:border-white/[0.1]
                             hover:bg-gray-50 dark:hover:bg-white/[0.07]
                             px-4 py-1.5 rounded-full
                             text-xs font-semibold
                             text-gray-700 dark:text-white/80
                             transition-all duration-200 shadow-sm"
                >
                  <PenSquare className="h-3.5 w-3.5" />
                  <span>Write</span>
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2
                               hover:bg-gray-100 dark:hover:bg-white/[0.07]
                               px-2.5 py-1.5 rounded-xl
                               transition-colors duration-200"
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-7 w-7 rounded-full object-cover ring-2 ring-transparent hover:ring-gray-300 dark:hover:ring-white/20 transition-all"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-gray-800 dark:bg-dp-s3 flex items-center justify-center text-white font-bold text-xs">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-white/90">
                      {user.name}
                    </span>
                  </button>

                  {showDropdown && (
                    <div
                      className="absolute right-0 mt-2 w-52
                                 bg-white dark:bg-[#161820]
                                 rounded-xl shadow-xl dark:shadow-black/60
                                 py-1.5 border border-gray-100 dark:border-white/[0.06]
                                 backdrop-blur-md
                                 animate-fadeIn"
                    >
                      {/* User info header */}
                      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-white/[0.05] mb-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-white/40 truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>

                      <Link
                        to={`/profile/${user._id}`}
                        className="flex items-center space-x-2.5 px-4 py-2.5
                                   text-sm text-gray-700 dark:text-white/80
                                   hover:bg-gray-50 dark:hover:bg-white/[0.06]
                                   transition-colors duration-150"
                        onClick={() => setShowDropdown(false)}
                      >
                        <User className="h-4 w-4 text-gray-400 dark:text-white/40" />
                        <span>Profile</span>
                      </Link>

                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          className="flex items-center space-x-2.5 px-4 py-2.5
                                     text-sm text-gray-700 dark:text-white/80
                                     hover:bg-gray-50 dark:hover:bg-white/[0.06]
                                     transition-colors duration-150"
                          onClick={() => setShowDropdown(false)}
                        >
                          <Shield className="h-4 w-4 text-violet-400" />
                          <span>Admin Panel</span>
                        </Link>
                      )}

                      <div className="border-t border-gray-100 dark:border-white/[0.05] mt-1 pt-1">
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            handleLogout();
                          }}
                          className="flex items-center space-x-2.5 px-4 py-2.5
                                     text-sm text-red-500 dark:text-red-400
                                     hover:bg-red-50 dark:hover:bg-red-500/[0.08]
                                     transition-colors duration-150 w-full text-left"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="bg-gray-900 dark:bg-amber-500 text-white dark:text-gray-950
                             px-4 py-2 rounded-lg text-sm
                             hover:bg-gray-800 dark:hover:bg-amber-400
                             transition-colors font-semibold shadow-sm"
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
