import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PostCard from '../components/PostCard';
import API, { isSilentError } from '../api/axios';
import { toast } from 'react-toastify';
import {
  Loader2,
  TrendingUp,
  Clock,
  Heart,
  MessageCircle,
  Home,
  Bookmark,
  Users,
  PenSquare,
  User,
  Shield,
  BookOpen,
  Mail,
  Star,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Settings,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────
   Time-based greeting
   ───────────────────────────────────────── */
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/* ─────────────────────────────────────────
   Avatar gradient helper
   ───────────────────────────────────────── */
const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#e8a838,#f07b38)',
  'linear-gradient(135deg,#7c6ef5,#5b4de8)',
  'linear-gradient(135deg,#34d399,#059669)',
  'linear-gradient(135deg,#60a5fa,#2563eb)',
  'linear-gradient(135deg,#f472b6,#db2777)',
];
const avatarGrad = (name = '') =>
  AVATAR_GRADIENTS[name.charCodeAt(0) % AVATAR_GRADIENTS.length];

/* ═══════════════════════════════════════════════════════
   LEFT SIDEBAR COMPONENT
   ═══════════════════════════════════════════════════════ */
const Sidebar = ({
  expanded,
  onToggle,
  activeTab,
  selectedTag,
  searchQuery,
  onTabChange,
  user,
  theme,
  onToggleTheme,
  onLogout,
}) => {
  const navItems = [
    { id: 'for-you',   icon: Home,     label: 'For You'   },
    { id: 'following', icon: Users,    label: 'Following' },
    { id: 'featured',  icon: Star,     label: 'Featured'  },
    { id: 'bookmarks', icon: Bookmark, label: 'Saved'     },
  ];

  const isActive = (id) =>
    activeTab === id && !selectedTag && !searchQuery;

  return (
    <aside
      id="main-sidebar"
      className="dp-left-sidebar"
      style={{
        width: expanded ? 'var(--dp-sidebar-w)' : 'var(--dp-sidebar-col-w)',
        minWidth: expanded ? 'var(--dp-sidebar-w)' : 'var(--dp-sidebar-col-w)',
      }}
    >
      {/* ── Inner scroll container ── */}
      <div
        className="dp-left-sidebar-inner scrollbar-none"
        style={{
          padding: expanded ? '20px 12px 20px 12px' : '20px 8px 20px 8px',
          transition: 'padding 0.28s ease',
        }}
      >

        {/* ── Collapse / Expand toggle ── */}
        <button
          id="sidebar-toggle"
          onClick={onToggle}
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-end' : 'center',
            padding: '6px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: 'var(--dp-muted)',
            transition: 'background 0.18s ease, color 0.18s ease, justify-content 0.28s ease',
            marginBottom: '14px',
            flexShrink: 0,
            width: '100%',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = 'var(--dp-s1)';
            e.currentTarget.style.color = 'var(--dp-body)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--dp-muted)';
          }}
        >
          <ChevronLeft
            style={{
              width: '16px',
              height: '16px',
              transition: 'transform 0.28s ease',
              transform: expanded ? 'rotate(0deg)' : 'rotate(180deg)',
              flexShrink: 0,
            }}
          />
        </button>

        {/* ── Write CTA ── */}
        <Link
          to="/create-post"
          id="sidebar-write"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '9px 12px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg,var(--dp-accent),#f07b38)',
            color: '#fff',
            fontSize: '0.82rem',
            fontWeight: 700,
            marginBottom: '18px',
            textDecoration: 'none',
            flexShrink: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            boxShadow: '0 2px 8px var(--dp-accent-glow)',
            transition: 'all 0.22s ease',
            justifyContent: expanded ? 'flex-start' : 'center',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.filter = 'brightness(1.08)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.filter = 'brightness(1)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <PenSquare style={{ width: '15px', height: '15px', flexShrink: 0 }} />
          {expanded && <span>New Story</span>}
        </Link>

        {/* ── Reading section label ── */}
        {expanded && (
          <p className="sidebar-section-label">Reading</p>
        )}

        {/* ── Nav items ── */}
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            id={`sidebar-${id}`}
            onClick={() => onTabChange(id)}
            title={!expanded ? label : undefined}
            className={`sidebar-nav-item${isActive(id) ? ' active' : ''}`}
            style={{
              justifyContent: expanded ? 'flex-start' : 'center',
            }}
          >
            <Icon style={{ width: '17px', height: '17px', flexShrink: 0 }} />
            {expanded && <span>{label}</span>}
          </button>
        ))}

        {/* ── Account section ── */}
        {expanded && (
          <p className="sidebar-section-label" style={{ marginTop: '20px' }}>
            Account
          </p>
        )}
        {!expanded && (
          <div style={{ height: '16px', flexShrink: 0 }} />
        )}

        {/* Profile */}
        {user && (
          <Link
            to={`/profile/${user._id}`}
            id="sidebar-profile"
            title={!expanded ? 'Profile' : undefined}
            className="sidebar-nav-item"
            style={{
              justifyContent: expanded ? 'flex-start' : 'center',
            }}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  flexShrink: 0,
                  border: '1.5px solid var(--dp-s3)',
                }}
              />
            ) : (
              <User style={{ width: '17px', height: '17px', flexShrink: 0 }} />
            )}
            {expanded && <span>Profile</span>}
          </Link>
        )}

        {/* Admin */}
        {user?.role === 'admin' && (
          <Link
            to="/admin"
            id="sidebar-admin"
            title={!expanded ? 'Admin' : undefined}
            className="sidebar-nav-item"
            style={{
              justifyContent: expanded ? 'flex-start' : 'center',
              color: 'rgb(239,68,68)',
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.07)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Shield style={{ width: '17px', height: '17px', flexShrink: 0 }} />
            {expanded && <span>Admin</span>}
          </Link>
        )}

        {/* ── Spacer ── */}
        <div style={{ flex: 1 }} />

        {/* ── Theme + Logout utility row ── */}
        <div
          style={{
            borderTop: '1px solid var(--dp-border)',
            paddingTop: '12px',
            marginTop: '8px',
            display: 'flex',
            flexDirection: expanded ? 'row' : 'column',
            gap: '6px',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <button
            id="sidebar-theme"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            aria-label="Toggle theme"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: '9px',
              border: 'none',
              background: 'transparent',
              color: 'var(--dp-subtle)',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              flex: expanded ? 1 : undefined,
              transition: 'all 0.18s ease',
              justifyContent: 'center',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'var(--dp-s1)';
              e.currentTarget.style.color = 'var(--dp-body)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--dp-subtle)';
            }}
          >
            {theme === 'dark'
              ? <Sun style={{ width: '15px', height: '15px', color: 'var(--dp-accent)', flexShrink: 0 }} />
              : <Moon style={{ width: '15px', height: '15px', flexShrink: 0 }} />
            }
            {expanded && <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
          </button>

          {user && (
            <button
              id="sidebar-logout"
              onClick={onLogout}
              title="Log out"
              aria-label="Log out"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '7px 10px',
                borderRadius: '9px',
                border: 'none',
                background: 'transparent',
                color: 'rgb(239,68,68)',
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <LogOut style={{ width: '15px', height: '15px', flexShrink: 0 }} />
            </button>
          )}
        </div>

        {/* DailyPen label */}
        {expanded && (
          <p
            style={{
              fontSize: '0.6rem',
              color: 'var(--dp-muted)',
              padding: '8px 4px 0',
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            DailyPen · 2026
          </p>
        )}
      </div>
    </aside>
  );
};

/* ═══════════════════════════════════════════════════════
   RIGHT SIDEBAR / WIDGETS COMPONENT
   ═══════════════════════════════════════════════════════ */
const RightSidebar = ({
  suggestedWriters,
  topTags,
  featuredPosts,
  selectedTag,
  followedWriters,
  onFollowToggle,
  onTagClick,
  onClearFilters,
}) => (
  <aside
    id="right-sidebar"
    className="dp-right-panel scrollbar-none"
  >
    {/* ── Suggested Writers ── */}
    {suggestedWriters.length > 0 && (
      <div className="widget-card">
        <p className="widget-header">Suggested Writers</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {suggestedWriters.slice(0, 4).map((writer) => {
            const isFollowing = followedWriters.includes(writer._id);
            return (
              <div key={writer._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', minWidth: 0 }}>
                <Link
                  to={`/profile/${writer._id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, textDecoration: 'none', flex: 1 }}
                >
                  {writer.avatar ? (
                    <img
                      src={writer.avatar}
                      alt={writer.name}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--dp-s2)' }}
                    />
                  ) : (
                    <div
                      style={{ width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.95rem', background: avatarGrad(writer.name) }}
                    >
                      {writer.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--dp-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {writer.name}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--dp-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
                      {writer.bio || 'Writer on DailyPen'}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => onFollowToggle(writer._id)}
                  className={isFollowing ? 'dp-follow-btn-active' : 'dp-follow-btn'}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* ── Trending Tags ── */}
    {topTags.length > 0 && (
      <div className="widget-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <p className="widget-header" style={{ marginBottom: 0 }}>Trending Tags</p>
          {selectedTag && (
            <button
              onClick={onClearFilters}
              style={{ fontSize: '0.68rem', fontWeight: 500, color: 'var(--dp-muted)', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.18s ease' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--dp-body)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--dp-muted)'}
            >
              View all
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {topTags.map((tag) => (
            <button
              key={tag}
              id={`tag-${tag}`}
              onClick={() => onTagClick(tag)}
              className={selectedTag === tag ? 'tag-pill-active' : 'tag-pill'}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    )}

    {/* ── Popular Reads ── */}
    {featuredPosts.length > 0 && (
      <div className="widget-card">
        <p className="widget-header">Popular Reads</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {featuredPosts.slice(0, 3).map((post, idx) => (
            <div key={post._id} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', minWidth: 0 }}>
              <span className="popular-num">{idx + 1}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Link
                  to={`/profile/${post.author?._id}`}
                  style={{ display: 'block', fontSize: '0.68rem', fontWeight: 600, color: 'var(--dp-muted)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px', transition: 'color 0.18s ease' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--dp-body)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--dp-muted)'}
                >
                  {post.author?.name}
                </Link>
                <Link
                  to={`/post/${post._id}`}
                  style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, color: 'var(--dp-heading)', textDecoration: 'none', lineHeight: 1.42, letterSpacing: '-0.01em', transition: 'color 0.18s ease' }}
                  className="line-clamp-2"
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--dp-accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--dp-heading)'}
                >
                  {post.title}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

    {/* Footer note */}
    <p style={{ fontSize: '0.6rem', color: 'var(--dp-muted)', padding: '0 4px', fontWeight: 500 }}>
      DailyPen · © 2026
    </p>
  </aside>
);

/* ═══════════════════════════════════════════════════════
   DASHBOARD — Main Component
   ═══════════════════════════════════════════════════════ */
const Dashboard = () => {
  const { user, updateUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // ── Sidebar state — persisted in localStorage ──
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    try { return localStorage.getItem('dp_sidebar') !== 'collapsed'; }
    catch { return true; }
  });

  // ── Mobile drawer state ──
  const [mobileOpen, setMobileOpen] = useState(false);
  const overlayRef = useRef(null);

  const toggleSidebar = () => {
    setSidebarExpanded(prev => {
      const next = !prev;
      try { localStorage.setItem('dp_sidebar', next ? 'expanded' : 'collapsed'); }
      catch {}
      return next;
    });
  };

  // Close mobile drawer on resize
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // ── Feed state ──
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeTab, setActiveTab] = useState('for-you');
  const [selectedTag, setSelectedTag] = useState('');
  const [featuredPosts, setFeaturedPosts] = useState([]);

  const followedWriters = user?.following || [];

  const handleLogout = () => { logout(); navigate('/'); };

  // ── EFFECTS ──
  useEffect(() => {
    if (activeTab !== 'for-you') return;
    const controller = new AbortController();
    fetchPosts(1, controller.signal);
    return () => controller.abort();
  }, [activeFilter, activeTab]); // eslint-disable-line

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    fetchSavedPosts(controller.signal);
    return () => controller.abort();
  }, [user?._id]); // eslint-disable-line

  useEffect(() => {
    const controller = new AbortController();
    (async () => {
      try {
        const { data } = await API.get('/posts/featured', { signal: controller.signal });
        setFeaturedPosts(data);
      } catch (err) {
        if (!isSilentError(err)) console.error(err.message);
      }
    })();
    return () => controller.abort();
  }, []);

  // ── API FUNCTIONS ──
  const fetchPosts = async (page = 1, signal) => {
    try {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      const { data } = await API.get(
        `/posts?sortBy=${activeFilter}&page=${page}&limit=9`,
        { signal }
      );
      if (page === 1) setPosts(data.posts);
      else setPosts(prev => [...prev, ...data.posts]);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      setHasMore(data.currentPage < data.totalPages);
    } catch (error) {
      if (isSilentError(error)) return;
      toast.error('Failed to fetch posts', { toastId: 'fetch-posts-error' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchSavedPosts = async (signal) => {
    try {
      const { data } = await API.get('/users/saved', { signal });
      setSavedPosts(data.map(p => p._id));
    } catch (error) {
      if (!isSilentError(error)) console.error(error.message);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) { setSearchQuery(''); setSelectedTag(''); setActiveTab('for-you'); setCurrentPage(1); fetchPosts(1); return; }
    setSearchQuery(query);
    setSelectedTag('');
    setActiveTab('for-you');
    setLoading(true);
    try {
      const { data } = await API.get(`/posts/search/${query}`);
      setPosts(data);
      setHasMore(false);
    } catch (error) {
      if (!isSilentError(error)) toast.error('Search failed', { toastId: 'search-error' });
    } finally { setLoading(false); }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setSearchQuery('');
    setSelectedTag('');
    setCurrentPage(1);
    setLoading(true);
  };

  const handleLoadMore = () => fetchPosts(currentPage + 1);

  const handleLike = async (postId) => {
    try {
      const { data } = await API.put(`/posts/${postId}/like`);
      const update = p => p._id === postId ? { ...p, likesCount: data.likesCount, likes: data.likes } : p;
      setPosts(ps => ps.map(update));
      setFeaturedPosts(ps => ps.map(update));
    } catch (error) {
      if (!isSilentError(error)) toast.error('Failed to like post', { toastId: 'like-error' });
    }
  };

  const handleSave = async (postId) => {
    try {
      const { data } = await API.put(`/users/save/${postId}`);
      setSavedPosts(data.savedPosts);
      toast.success(savedPosts.includes(postId) ? 'Removed from Bookmarks' : 'Saved to Bookmarks', { toastId: `save-${postId}` });
      if (activeTab === 'bookmarks') setPosts(prev => prev.filter(p => p._id !== postId));
    } catch (error) {
      if (!isSilentError(error)) toast.error('Failed to save post', { toastId: 'save-error' });
    }
  };

  const handleFollowToggle = async (authorId) => {
    try {
      const { data } = await API.put(`/users/profile/follow/${authorId}`);
      updateUser({ following: data.currentUserFollowing });
      toast.success(data.isFollowing ? 'Author followed' : 'Unfollowed author', { toastId: `follow-${authorId}` });
    } catch (error) {
      if (!isSilentError(error)) toast.error(error.response?.data?.message || 'Failed to toggle follow');
    }
  };

  const handleTagClick = async (tag) => {
    setSelectedTag(tag);
    setSearchQuery('');
    setActiveTab('for-you');
    setLoading(true);
    try {
      const { data } = await API.get(`/posts/tag/${tag}`);
      setPosts(data);
      setHasMore(false);
    } catch (error) {
      if (!isSilentError(error)) toast.error('Failed to load tag posts', { toastId: 'tag-error' });
    } finally { setLoading(false); }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    setSelectedTag('');
    setSearchQuery('');
    setMobileOpen(false);

    if (tab === 'for-you') {
      setCurrentPage(1);
      fetchPosts(1);
    } else if (tab === 'featured') {
      setLoading(true);
      try {
        const { data } = await API.get('/posts/featured');
        setPosts(data);
        setHasMore(false);
      } catch (err) {
        if (!isSilentError(err)) toast.error('Failed to load featured', { toastId: 'featured-error' });
      } finally { setLoading(false); }
    } else if (tab === 'bookmarks') {
      setLoading(true);
      try {
        const { data } = await API.get('/users/saved');
        setPosts(data);
        setHasMore(false);
      } catch (err) {
        if (!isSilentError(err)) toast.error('Failed to load saved', { toastId: 'saved-error' });
      } finally { setLoading(false); }
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTag('');
    setActiveTab('for-you');
    setCurrentPage(1);
    fetchPosts(1);
  };

  // ── DERIVED DATA ──
  const suggestedWriters = [];
  const seenW = new Set();
  posts.forEach(post => {
    if (post.author && post.author._id !== user?._id && !seenW.has(post.author._id)) {
      seenW.add(post.author._id);
      suggestedWriters.push(post.author);
    }
  });

  const tagCounts = {};
  posts.forEach(post => post.tags?.forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const topTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]).slice(0, 8);

  const displayedPosts = activeTab === 'following'
    ? posts.filter(p => p.author && followedWriters.includes(p.author._id))
    : posts;

  const sortingFilters = [
    { id: 'recent',    label: 'Recent',        icon: Clock },
    { id: 'liked',     label: 'Most Liked',    icon: Heart },
    { id: 'commented', label: 'Top Discussed', icon: MessageCircle },
    { id: 'oldest',    label: 'Oldest',        icon: TrendingUp },
  ];

  const feedTitle =
    searchQuery ? `"${searchQuery}"`
    : selectedTag ? `#${selectedTag}`
    : activeTab === 'for-you'   ? 'For You'
    : activeTab === 'following' ? 'Following'
    : activeTab === 'bookmarks' ? 'Saved'
    : activeTab === 'featured'  ? 'Featured'
    : 'Stories';

  const feedSub =
    !searchQuery && !selectedTag && activeTab !== 'for-you'
      ? activeTab === 'following' ? 'Stories from writers you follow'
        : activeTab === 'bookmarks' ? 'Articles you have saved'
        : activeTab === 'featured'  ? "Editor's picks and top stories"
        : null
      : null;

  /* ── SIDEBAR SHARED PROPS ── */
  const sidebarProps = {
    activeTab,
    selectedTag,
    searchQuery,
    onTabChange: handleTabChange,
    user,
    theme,
    onToggleTheme: toggleTheme,
    onLogout: handleLogout,
  };

  /* ── LOADING SCREEN ── */
  if (loading && posts.length === 0) {
    return (
      <div className="dp-page">
        <Navbar showSearch onSearch={handleSearch} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <Loader2 className="animate-spin" style={{ width: '32px', height: '32px', color: 'var(--dp-accent)' }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--dp-muted)', fontWeight: 500 }}>
              Loading your reading feed…
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── MAIN RENDER ── */
  return (
    <div className="dp-page">

      {/* ── NAVBAR ── */}
      <Navbar showSearch onSearch={handleSearch} />

      {/* ─────────────────────────────────────────────────
          LAYOUT SHELL — flex row below navbar
          NO overflow:hidden here — page scroll must be native
          This is the critical fix for sticky behavior
          ───────────────────────────────────────────────── */}
      <div className="dp-layout-shell">

        {/* ── DESKTOP SIDEBAR ── */}
        <div className="hidden-mobile">
          <Sidebar
            expanded={sidebarExpanded}
            onToggle={toggleSidebar}
            {...sidebarProps}
          />
        </div>

        {/* ── MOBILE OVERLAY ── */}
        {mobileOpen && (
          <div
            ref={overlayRef}
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.45)',
              zIndex: 50,
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />
        )}

        {/* ── MOBILE DRAWER SIDEBAR ── */}
        <div
          className="mobile-drawer"
          style={{
            transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
            position: 'fixed',
            top: '68px',
            left: 0,
            bottom: 0,
            zIndex: 51,
            width: '260px',
            boxShadow: mobileOpen ? '4px 0 32px rgba(0,0,0,0.18)' : 'none',
          }}
        >
          <Sidebar
            expanded={true}
            onToggle={() => setMobileOpen(false)}
            {...sidebarProps}
          />
        </div>

        {/* ─────────────────────────────────────────────────
            CONTENT AREA — feed + right sidebar
            Natural page scroll, no overflow tricks
            ───────────────────────────────────────────────── */}
        <div className="dp-content-area">
          <div className="dp-content-inner">

            {/* ═══════════════════════════════════
                CENTER FEED — reading-first layout
                ═══════════════════════════════════ */}
            <main
              id="feed-main"
              className="dp-feed-main"
            >

              {/* ── Mobile menu button ── */}
              <div className="mobile-menu-btn">
                <button
                  id="mobile-menu-open"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open menu"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px 6px 8px',
                    borderRadius: '10px',
                    border: '1px solid var(--dp-border)',
                    background: 'transparent',
                    color: 'var(--dp-subtle)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    marginBottom: '20px',
                    transition: 'all 0.18s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = 'var(--dp-s1)';
                    e.currentTarget.style.color = 'var(--dp-body)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = 'var(--dp-subtle)';
                  }}
                >
                  <Menu style={{ width: '16px', height: '16px' }} />
                  <span>{feedTitle}</span>
                </button>
              </div>

              {/* ── Feed Context Header ── */}
              <div className="feed-context-header">
                <div>
                  <h1 className="feed-context-title">{feedTitle}</h1>
                  {user && !searchQuery && !selectedTag && activeTab === 'for-you' && (
                    <p className="feed-context-sub">
                      {getGreeting()},{' '}
                      <span style={{ color: 'var(--dp-accent)', fontWeight: 600 }}>
                        {user.name.split(' ')[0]}
                      </span>
                    </p>
                  )}
                  {feedSub && (
                    <p className="feed-context-sub">{feedSub}</p>
                  )}
                </div>
              </div>

              {/* ── Sort Filter Pills ── */}
              {activeTab === 'for-you' && !searchQuery && !selectedTag && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px', paddingTop: '16px' }}>
                  {sortingFilters.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      id={`filter-${id}`}
                      onClick={() => handleFilterChange(id)}
                      className={activeFilter === id ? 'filter-pill-active' : 'filter-pill'}
                    >
                      <Icon style={{ width: '11px', height: '11px' }} />
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* ── Active filter indicator ── */}
              {(searchQuery || selectedTag) && (
                <div className="dp-filter-bar" style={{ marginBottom: '8px', marginTop: '8px' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--dp-heading)' }}>
                    {displayedPosts.length} {displayedPosts.length === 1 ? 'result' : 'results'} for{' '}
                    <span style={{ color: 'var(--dp-accent)' }}>
                      {searchQuery ? `"${searchQuery}"` : `#${selectedTag}`}
                    </span>
                  </p>
                  <button
                    onClick={clearFilters}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: 'var(--dp-subtle)',
                      padding: '4px 12px',
                      borderRadius: '9999px',
                      backgroundColor: 'var(--dp-s2)',
                      border: '1px solid var(--dp-border)',
                      cursor: 'pointer',
                      transition: 'all 0.18s ease',
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--dp-s3)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--dp-s2)'}
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* ── FEED CONTENT ── */}
              {loading && posts.length > 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '56px 0' }}>
                  <Loader2 className="animate-spin" style={{ width: '24px', height: '24px', color: 'var(--dp-accent)' }} />
                </div>
              ) : displayedPosts.length === 0 ? (
                activeTab === 'following' ? (
                  /* Following empty state */
                  <div className="dp-empty" style={{ maxWidth: '420px', margin: '32px auto 0' }}>
                    <div style={{ width: '52px', height: '52px', borderRadius: '50%', backgroundColor: 'var(--dp-s2)', border: '1px solid var(--dp-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Users style={{ width: '22px', height: '22px', color: 'var(--dp-muted)' }} />
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dp-heading)', marginBottom: '8px' }}>
                      Personalize your reading
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--dp-subtle)', lineHeight: 1.6, marginBottom: '24px' }}>
                      Follow writers you love to build your own curated feed.
                    </p>
                    {suggestedWriters.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '300px', margin: '0 auto' }}>
                        <p style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--dp-muted)', textAlign: 'center', marginBottom: '4px' }}>
                          Writers to follow
                        </p>
                        {suggestedWriters.slice(0, 3).map(writer => (
                          <div key={writer._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '14px', backgroundColor: 'var(--dp-s2)', border: '1px solid var(--dp-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                              {writer.avatar ? (
                                <img src={writer.avatar} alt={writer.name} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: avatarGrad(writer.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>
                                  {writer.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--dp-body)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {writer.name}
                              </p>
                            </div>
                            <button onClick={() => handleFollowToggle(writer._id)} className={followedWriters.includes(writer._id) ? 'dp-follow-btn-active' : 'dp-follow-btn'}>
                              {followedWriters.includes(writer._id) ? 'Following' : 'Follow'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* General empty state */
                  <div className="dp-empty" style={{ marginTop: '32px' }}>
                    <BookOpen style={{ width: '36px', height: '36px', color: 'var(--dp-s3)', margin: '0 auto 12px' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dp-heading)', marginBottom: '6px' }}>
                      No articles found
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--dp-subtle)', maxWidth: '280px', margin: '0 auto' }}>
                      {searchQuery ? 'No results matched your search.' : 'Be the first to publish on DailyPen!'}
                    </p>
                    {(searchQuery || selectedTag) && (
                      <button
                        onClick={clearFilters}
                        style={{ marginTop: '20px', fontSize: '0.8rem', fontWeight: 600, padding: '8px 20px', borderRadius: '12px', backgroundColor: 'var(--dp-s2)', border: '1px solid var(--dp-border)', color: 'var(--dp-body)', cursor: 'pointer' }}
                      >
                        Browse all posts
                      </button>
                    )}
                  </div>
                )
              ) : (
                /* Post list — reading-flow feed */
                <div style={{ paddingTop: '8px' }}>
                  {displayedPosts.map(post => (
                    <PostCard
                      key={post._id}
                      post={post}
                      onLike={handleLike}
                      onSave={handleSave}
                      isLiked={post.likes?.includes(user?._id)}
                      isSaved={savedPosts.includes(post._id)}
                    />
                  ))}
                </div>
              )}

              {/* ── Load More ── */}
              {activeTab === 'for-you' && !searchQuery && !selectedTag && hasMore && (
                <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
                  <button
                    id="load-more-btn"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="dp-load-more"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="animate-spin" style={{ width: '14px', height: '14px', color: 'var(--dp-accent)' }} />
                        <span>Loading…</span>
                      </>
                    ) : (
                      <>
                        <span>Load more stories</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--dp-muted)' }}>
                          ({currentPage}/{totalPages})
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* ── Newsletter Card ── */}
              <div className="dp-newsletter-card">
                <div
                  style={{
                    position: 'absolute',
                    top: '-40px',
                    right: '-40px',
                    width: '140px',
                    height: '140px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, var(--dp-accent-glow), transparent)',
                    filter: 'blur(32px)',
                    pointerEvents: 'none',
                  }}
                />
                <div style={{ position: 'relative' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px', borderRadius: '12px', background: 'linear-gradient(135deg,var(--dp-accent),#f07b38)', marginBottom: '14px' }}>
                    <Mail style={{ width: '16px', height: '16px', color: '#fff' }} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dp-heading)', marginBottom: '6px' }}>
                    Never miss a great story
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--dp-subtle)', marginBottom: '20px', lineHeight: 1.6 }}>
                    The week's best stories and writing tips — delivered to your inbox.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const email = e.target.email.value;
                      if (email) { toast.success('Thank you for subscribing!'); e.target.reset(); }
                    }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '420px' }}
                  >
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        type="email"
                        name="email"
                        placeholder="your@email.com"
                        required
                        className="dp-input"
                        style={{ flex: 1, minWidth: '180px' }}
                      />
                      <button
                        type="submit"
                        className="dp-write-btn"
                        style={{ borderRadius: '10px', whiteSpace: 'nowrap' }}
                      >
                        Subscribe
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Footer on desktop */}
              <div className="hidden-mobile" style={{ marginTop: '48px' }}>
                <Footer />
              </div>

            </main>

            {/* ═══════════════════════════════════
                RIGHT SIDEBAR
                position:sticky + align-self:start
                = THE correct sticky pattern
                ═══════════════════════════════════ */}
            <RightSidebar
              suggestedWriters={suggestedWriters}
              topTags={topTags}
              featuredPosts={featuredPosts}
              selectedTag={selectedTag}
              followedWriters={followedWriters}
              onFollowToggle={handleFollowToggle}
              onTagClick={handleTagClick}
              onClearFilters={clearFilters}
            />

          </div>
        </div>
      </div>

      {/* ── MOBILE BOTTOM NAVIGATION ── */}
      <nav
        className="mobile-bottom-nav"
        style={{
          backgroundColor: 'var(--dp-bg)',
          borderTop: '1px solid var(--dp-border)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        }}
      >
        {[
          { id: 'for-you',   icon: Home,    label: 'Home',      action: () => handleTabChange('for-you') },
          { id: 'following', icon: Users,   label: 'Following', action: () => handleTabChange('following') },
          { id: 'featured',  icon: Star,    label: 'Featured',  action: () => handleTabChange('featured') },
          { id: 'bookmarks', icon: Bookmark,label: 'Saved',     action: () => handleTabChange('bookmarks') },
        ].map(({ id, icon: Icon, label, action }) => {
          const active = activeTab === id && !selectedTag && !searchQuery;
          return (
            <button
              key={id}
              id={`mobile-nav-${id}`}
              onClick={action}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                padding: '4px 8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: active ? 'var(--dp-accent)' : 'var(--dp-muted)',
                transform: active ? 'scale(1.08)' : 'scale(1)',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon style={{ width: '20px', height: '20px' }} />
              <span style={{ fontSize: '9px', fontWeight: 600 }}>{label}</span>
            </button>
          );
        })}
        <Link
          to="/create-post"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', padding: '4px 8px', color: 'var(--dp-muted)', textDecoration: 'none' }}
        >
          <PenSquare style={{ width: '20px', height: '20px' }} />
          <span style={{ fontSize: '9px', fontWeight: 600 }}>Write</span>
        </Link>
      </nav>

      {/* Mobile spacer */}
      <div className="mobile-nav-spacer" />

    </div>
  );
};

export default Dashboard;