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
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ onSearch, showSearch = false }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const dropdownRef = useRef(null);

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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav
      className="sticky top-0 z-50 transition-colors duration-300"
      style={{
        backgroundColor: 'var(--dp-bg)',
        borderBottom: '1px solid var(--dp-border)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        boxShadow: '0 1px 0 var(--dp-border)',
      }}
    >
      <div style={{ maxWidth: '100%', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 'var(--dp-navbar-h)', gap: '16px' }}>

          {/* ── Logo ── */}
          <Link
            to={user ? '/dashboard' : '/'}
            style={{ display: 'flex', alignItems: 'center', gap: '1px', flexShrink: 0, textDecoration: 'none' }}
          >
            <span
              style={{
                fontSize: '1.2rem',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: 'var(--dp-heading)',
                fontFamily: 'var(--dp-font-display)',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.parentElement.style.opacity = '0.72'}
              onMouseLeave={e => e.currentTarget.parentElement.style.opacity = '1'}
            >
              Daily
            </span>
            <span
              style={{
                fontSize: '1.2rem',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                color: 'var(--dp-accent)',
                fontFamily: 'var(--dp-font-display)',
              }}
            >
              Pen
            </span>
          </Link>

          {/* ── Search Bar ── */}
          {showSearch && (
            <form
              onSubmit={handleSearch}
              style={{ flex: 1, maxWidth: '480px', margin: '0 8px' }}
            >
              <div style={{ position: 'relative' }}>
                <Search
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '14px',
                    height: '14px',
                    pointerEvents: 'none',
                    color: searchFocused ? 'var(--dp-accent)' : 'var(--dp-muted)',
                    transition: 'color 0.2s ease',
                  }}
                />
                <input
                  id="navbar-search"
                  type="text"
                  placeholder="Search stories…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  className="dp-search-field"
                />
              </div>
            </form>
          )}

          {/* ── Right Controls ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>

            {/* Theme Toggle */}
            <button
              id="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              style={{
                padding: '8px',
                borderRadius: '9999px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--dp-subtle)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--dp-s1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {theme === 'dark' ? (
                <Sun style={{ width: '16px', height: '16px', color: 'var(--dp-accent)' }} />
              ) : (
                <Moon style={{ width: '16px', height: '16px' }} />
              )}
            </button>

            {user ? (
              <>
                {/* Write CTA */}
                <Link
                  to="/create-post"
                  id="write-btn"
                  className="dp-write-btn"
                  style={{ display: window.innerWidth < 480 ? 'none' : undefined }}
                >
                  <PenSquare style={{ width: '14px', height: '14px' }} />
                  <span>Write</span>
                </Link>

                {/* User Dropdown */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                  <button
                    id="user-avatar-btn"
                    onClick={() => setShowDropdown(!showDropdown)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '5px 8px 5px 5px',
                      borderRadius: '12px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      color: 'var(--dp-body)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--dp-s1)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                          border: '2px solid',
                          borderColor: showDropdown ? 'var(--dp-accent)' : 'var(--dp-s3)',
                          transition: 'border-color 0.2s ease',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '12px',
                          background: 'linear-gradient(135deg, #e8a838, #f07b38)',
                        }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span
                      style={{
                        fontSize: '0.83rem',
                        fontWeight: 500,
                        color: 'var(--dp-body)',
                        display: window.innerWidth < 768 ? 'none' : undefined,
                      }}
                    >
                      {user.name.split(' ')[0]}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div
                      id="user-dropdown"
                      className="animate-fadeIn"
                      style={{
                        position: 'absolute',
                        right: 0,
                        marginTop: '10px',
                        width: '220px',
                        padding: '6px 0',
                        borderRadius: '16px',
                        backgroundColor: 'var(--dp-bg)',
                        border: '1px solid var(--dp-border)',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
                        zIndex: 100,
                      }}
                    >
                      {/* User info header */}
                      <div
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--dp-border)',
                          marginBottom: '4px',
                        }}
                      >
                        <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--dp-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.name}
                        </p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--dp-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.email}
                        </p>
                      </div>

                      {[
                        {
                          to: `/profile/${user._id}`,
                          icon: <User style={{ width: '15px', height: '15px', color: 'var(--dp-muted)' }} />,
                          label: 'My Profile',
                          show: true,
                        },
                        {
                          to: '/admin',
                          icon: <Shield style={{ width: '15px', height: '15px', color: '#7c3aed' }} />,
                          label: 'Admin Panel',
                          show: user.role === 'admin',
                        },
                      ].filter(i => i.show).map(item => (
                        <Link
                          key={item.label}
                          to={item.to}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '9px 16px',
                            fontSize: '0.84rem',
                            color: 'var(--dp-body)',
                            textDecoration: 'none',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--dp-s1)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          onClick={() => setShowDropdown(false)}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </Link>
                      ))}

                      <div style={{ borderTop: '1px solid var(--dp-border)', marginTop: '4px', paddingTop: '4px' }}>
                        <button
                          onClick={() => {
                            setShowDropdown(false);
                            handleLogout();
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '9px 16px',
                            fontSize: '0.84rem',
                            color: 'rgb(239,68,68)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            width: '100%',
                            textAlign: 'left',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <LogOut style={{ width: '15px', height: '15px' }} />
                          <span>Log out</span>
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
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 500,
                    color: 'var(--dp-subtle)',
                    textDecoration: 'none',
                    padding: '6px 10px',
                    borderRadius: '8px',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--dp-heading)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--dp-subtle)'}
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  id="get-started-btn"
                  className="dp-write-btn"
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
