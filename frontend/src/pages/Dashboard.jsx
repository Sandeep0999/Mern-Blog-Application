import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
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
  Hash,
  ArrowRight,
  Mail,
  Sparkles,
  Search,
  Plus,
  Check
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  
  // Existing feed states
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // New Medium-inspired states
  const [activeTab, setActiveTab] = useState('for-you'); // 'for-you', 'following', 'featured', 'bookmarks'
  const [selectedTag, setSelectedTag] = useState('');
  const [featuredPosts, setFeaturedPosts] = useState([]);
  
  // Derived follow state from synced Auth context
  const followedWriters = user?.following || [];

  // ── EFFECT 1: Fetch posts when filter or tab changes ──
  // Uses AbortController so previous in-flight requests are cancelled.
  useEffect(() => {
    if (activeTab !== 'for-you') return;
    const controller = new AbortController();
    fetchPosts(1, controller.signal);
    return () => controller.abort();
  }, [activeFilter, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── EFFECT 2: Fetch saved posts once when user is available ──
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    fetchSavedPosts(controller.signal);
    return () => controller.abort();
  }, [user?._id]); // re-run only if user identity changes

  // ── EFFECT 3: Fetch featured posts once on mount ──
  useEffect(() => {
    const controller = new AbortController();
    const fetchFeatured = async () => {
      try {
        const { data } = await API.get('/posts/featured', { signal: controller.signal });
        setFeaturedPosts(data);
      } catch (err) {
        if (!isSilentError(err)) console.error('Failed to fetch featured posts:', err.message);
      }
    };
    fetchFeatured();
    return () => controller.abort();
  }, []);


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
      if (isSilentError(error)) return; // AbortError or AuthError — stay silent
      toast.error('Failed to fetch posts', { toastId: 'fetch-posts-error' });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchSavedPosts = async (signal) => {
    try {
      const { data } = await API.get('/users/saved', { signal });
      setSavedPosts(data.map(post => post._id));
    } catch (error) {
      if (!isSilentError(error)) {
        console.error('Failed to fetch saved posts:', error.message);
      }
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchQuery('');
      setSelectedTag('');
      setActiveTab('for-you');
      setCurrentPage(1);
      fetchPosts(1);
      return;
    }

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
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setSearchQuery('');
    setSelectedTag('');
    setCurrentPage(1);
    setLoading(true);
  };

  const handleLoadMore = () => {
    const nextPage = currentPage + 1;
    fetchPosts(nextPage);
  };

  const handleLike = async (postId) => {
    try {
      const { data } = await API.put(`/posts/${postId}/like`);
      setPosts(posts.map(post =>
        post._id === postId ? { ...post, likesCount: data.likesCount, likes: data.likes } : post
      ));
      setFeaturedPosts(featuredPosts.map(post =>
        post._id === postId ? { ...post, likesCount: data.likesCount, likes: data.likes } : post
      ));
    } catch (error) {
      if (!isSilentError(error)) toast.error('Failed to like post', { toastId: 'like-error' });
    }
  };

  const handleSave = async (postId) => {
    try {
      const { data } = await API.put(`/users/save/${postId}`);
      setSavedPosts(data.savedPosts);
      toast.success(
        savedPosts.includes(postId) ? 'Post removed from Bookmarks' : 'Post saved to Bookmarks',
        { toastId: `save-${postId}` }
      );
      if (activeTab === 'bookmarks') {
        setPosts(prev => prev.filter(post => post._id !== postId));
      }
    } catch (error) {
      if (!isSilentError(error)) toast.error('Failed to save post', { toastId: 'save-error' });
    }
  };

  const handleFollowToggle = async (authorId) => {
    try {
      const { data } = await API.put(`/users/profile/follow/${authorId}`);
      updateUser({ following: data.currentUserFollowing });
      toast.success(data.isFollowing ? 'Author followed' : 'Unfollowed author', {
        toastId: `follow-toggle-${authorId}`,
      });
    } catch (error) {
      if (!isSilentError(error)) {
        toast.error(error.response?.data?.message || 'Failed to toggle follow status');
      }
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
      if (!isSilentError(error)) toast.error('Failed to load posts for tag', { toastId: 'tag-error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    setSelectedTag('');
    setSearchQuery('');

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
        if (!isSilentError(err)) toast.error('Failed to load featured posts', { toastId: 'featured-error' });
      } finally {
        setLoading(false);
      }
    } else if (tab === 'bookmarks') {
      setLoading(true);
      try {
        const { data } = await API.get('/users/saved');
        setPosts(data);
        setHasMore(false);
      } catch (err) {
        if (!isSilentError(err)) toast.error('Failed to load saved posts', { toastId: 'saved-error' });
      } finally {
        setLoading(false);
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTag('');
    setActiveTab('for-you');
    setCurrentPage(1);
    fetchPosts(1);
  };

  // Derive unique suggested writers from current posts
  const suggestedWriters = [];
  const seenWriters = new Set();
  posts.forEach(post => {
    if (post.author && post.author._id !== user?._id && !seenWriters.has(post.author._id)) {
      seenWriters.add(post.author._id);
      suggestedWriters.push(post.author);
    }
  });

  // Derive top tags from loaded posts
  const tagCounts = {};
  posts.forEach(post => {
    if (post.tags) {
      post.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });
  const topTags = Object.keys(tagCounts)
    .sort((a, b) => tagCounts[b] - tagCounts[a])
    .slice(0, 6);

  // Filter posts if Following tab is active
  const displayedPosts = activeTab === 'following' 
    ? posts.filter(post => post.author && followedWriters.includes(post.author._id))
    : posts;

  const sortingFilters = [
    { id: 'recent', label: 'Most Recent', icon: Clock },
    { id: 'liked', label: 'Most Liked', icon: Heart },
    { id: 'commented', label: 'Most Commented', icon: MessageCircle },
    { id: 'oldest', label: 'Oldest', icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#0c0e14] transition-colors duration-300">
        <Navbar showSearch onSearch={handleSearch} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-9 w-9 animate-spin text-gray-400 dark:text-amber-400" />
            <p className="text-sm font-medium text-gray-400 dark:text-[#555d74]">Loading your reading feed...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0c0e14] transition-colors duration-300">
      <Navbar showSearch onSearch={handleSearch} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-10 items-start">
          
          {/* ================= LEFT SIDEBAR (STICKY NAVIGATION) ================= */}
          <aside className="hidden md:flex md:col-span-3 lg:col-span-2 flex-col space-y-1 sticky top-24 self-start border-r border-gray-100 dark:border-white/[0.04] pr-4 xl:pr-6">
            <button 
              onClick={() => handleTabChange('for-you')}
              className={activeTab === 'for-you' && !selectedTag && !searchQuery ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </button>

            <button 
              onClick={() => handleTabChange('bookmarks')}
              className={activeTab === 'bookmarks' ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <Bookmark className="h-5 w-5" />
              <span>Saved</span>
            </button>

            <button 
              onClick={() => setActiveTab('following')}
              className={activeTab === 'following' ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <Users className="h-5 w-5" />
              <span>Following</span>
            </button>

            <Link to="/create-post" className="sidebar-link">
              <PenSquare className="h-5 w-5" />
              <span>Write</span>
            </Link>

            {user && (
              <Link to={`/profile/${user._id}`} className="sidebar-link">
                <User className="h-5 w-5" />
                <span>Profile</span>
              </Link>
            )}

            {user?.role === 'admin' && (
              <Link to="/admin" className="sidebar-link !text-red-500 dark:!text-red-400">
                <Shield className="h-5 w-5" />
                <span>Admin</span>
              </Link>
            )}

            {/* Sidebar footer hint */}
            <div className="pt-4 mt-2 border-t border-gray-100 dark:border-white/[0.04]">
              <p className="px-4 text-[10px] text-gray-300 dark:text-[#2e3347] font-medium">
                DailyPen · 2026
              </p>
            </div>
          </aside>

          {/* ================= CENTER FEED AREA ================= */}
          <section className="col-span-1 md:col-span-9 lg:col-span-7 xl:col-span-7 space-y-5">
            
            {/* Category and Filter Navigation Tabs */}
            <div className="border-b border-gray-100 dark:border-white/[0.05] pb-0 flex items-center justify-between">
              <div className="flex items-center space-x-5 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => handleTabChange('for-you')}
                  className={activeTab === 'for-you' ? 'feed-tab-active' : 'feed-tab'}
                >
                  For You
                </button>
                <button
                  onClick={() => handleTabChange('following')}
                  className={activeTab === 'following' ? 'feed-tab-active' : 'feed-tab'}
                >
                  Following
                </button>
                <button
                  onClick={() => handleTabChange('bookmarks')}
                  className={activeTab === 'bookmarks' ? 'feed-tab-active' : 'feed-tab'}
                >
                  Bookmarks
                </button>
                <button
                  onClick={() => handleTabChange('featured')}
                  className={activeTab === 'featured' ? 'feed-tab-active' : 'feed-tab'}
                >
                  Featured
                </button>
              </div>

              {/* Sparkle badge */}
              <div className="hidden sm:flex items-center space-x-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 flex-shrink-0">
                <Sparkles className="h-3 w-3 fill-current" />
                <span>Premium</span>
              </div>
            </div>

            {/* Sub-Filters: Sort buttons (Only for "For You" tab when no search/tag filter is active) */}
            {activeTab === 'for-you' && !searchQuery && !selectedTag && (
              <div className="flex flex-wrap gap-2 pt-1">
                {sortingFilters.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activeFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => handleFilterChange(filter.id)}
                      className={isActive ? 'filter-pill-active' : 'filter-pill'}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{filter.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Filter Indicators (Active Tag Search or Search queries) */}
            {(searchQuery || selectedTag) && (
              <div className="flex items-center justify-between bg-gray-50 dark:bg-[#111318] border border-gray-100 dark:border-white/[0.05] p-4 rounded-xl">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-[#f0f2f8]">
                    {searchQuery ? `Results for "${searchQuery}"` : `Tag: #${selectedTag}`}
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-[#555d74] mt-0.5">
                    {displayedPosts.length} {displayedPosts.length === 1 ? 'match' : 'matches'}
                  </p>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-gray-700 dark:text-[#c8d0e0] bg-white dark:bg-[#1c1f2b] hover:bg-gray-50 dark:hover:bg-[#252836] border border-gray-200 dark:border-white/[0.06] px-3 py-1.5 rounded-lg transition-colors"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Main Feed Content List */}
            {displayedPosts.length === 0 ? (
              activeTab === 'following' ? (
                // Elegant empty state for Following tab
                <div className="text-center py-16 px-6 border border-dashed border-gray-200 dark:border-white/[0.05] rounded-2xl bg-white dark:bg-[#111318] max-w-md mx-auto animate-fadeIn">
                  <div className="w-14 h-14 bg-gray-50 dark:bg-[#1c1f2b] rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-white/[0.05]">
                    <Users className="h-6 w-6 text-gray-300 dark:text-[#555d74]" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-[#f0f2f8] mb-2">
                    Personalize your reading experience
                  </h3>
                  <p className="text-sm text-gray-400 dark:text-[#555d74] mb-6 leading-relaxed">
                    Follow writers to populate your feed with their latest stories.
                  </p>
                  
                  {suggestedWriters.length > 0 && (
                    <div className="text-left space-y-2 max-w-xs mx-auto">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-[#555d74] uppercase tracking-widest mb-2 text-center">
                        Writers to Follow
                      </p>
                      {suggestedWriters.slice(0, 3).map((writer) => (
                        <div key={writer._id} className="flex items-center justify-between bg-gray-50 dark:bg-[#1c1f2b] p-2.5 rounded-xl border border-gray-100 dark:border-white/[0.05]">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            {writer.avatar ? (
                              <img src={writer.avatar} alt={writer.name} className="h-7 w-7 rounded-full object-cover" />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-gray-800 dark:bg-[#252836] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {writer.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-900 dark:text-[#c8d0e0] truncate">{writer.name}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleFollowToggle(writer._id)}
                            className="text-[10px] font-bold text-gray-700 dark:text-[#c8d0e0] px-2.5 py-1 bg-white dark:bg-[#252836] hover:bg-gray-50 dark:hover:bg-[#2e3347] border border-gray-200 dark:border-white/[0.06] rounded-full transition-colors"
                          >
                            Follow
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // General empty state
                <div className="text-center py-20 bg-gray-50 dark:bg-[#111318] border border-dashed border-gray-100 dark:border-white/[0.05] rounded-2xl">
                  <BookOpen className="h-9 w-9 text-gray-300 dark:text-[#2e3347] mx-auto mb-3" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-[#f0f2f8] mb-1.5">
                    No articles found
                  </h3>
                  <p className="text-sm text-gray-400 dark:text-[#555d74] max-w-xs mx-auto">
                    {searchQuery 
                      ? 'No results matched your search terms.' 
                      : 'Be the first writer to publish an article on DailyPen!'}
                  </p>
                  {(searchQuery || selectedTag) && (
                    <button
                      onClick={clearFilters}
                      className="mt-5 text-xs font-semibold text-gray-700 dark:text-[#c8d0e0] px-4 py-2 bg-white dark:bg-[#1c1f2b] border border-gray-200 dark:border-white/[0.06] rounded-lg hover:bg-gray-50 dark:hover:bg-[#252836] transition-colors"
                    >
                      Browse all posts
                    </button>
                  )}
                </div>
              )
            ) : (
              <div className="space-y-4">
                {displayedPosts.map((post) => (
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

            {/* Load More Button */}
            {activeTab === 'for-you' && !searchQuery && !selectedTag && hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center space-x-2
                             border border-gray-200 dark:border-white/[0.08]
                             bg-white dark:bg-[#161820]
                             hover:bg-gray-50 dark:hover:bg-[#1c1f2b]
                             text-gray-700 dark:text-[#c8d0e0]
                             px-6 py-2.5 rounded-full font-medium
                             transition-all duration-200
                             disabled:opacity-40 disabled:cursor-not-allowed
                             shadow-sm text-xs"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Load more stories</span>
                      <span className="text-gray-300 dark:text-[#2e3347] text-[10px]">
                        ({currentPage}/{totalPages})
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ================= NEWSLETTER CARD ================= */}
            <div className="mt-10 bg-gray-50 dark:bg-[#111318] border border-gray-100 dark:border-white/[0.05] rounded-2xl p-6 sm:p-8 relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-400/10 dark:bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="relative max-w-xl">
                <div className="inline-flex items-center justify-center p-2 bg-amber-500 text-white rounded-xl mb-4 shadow-sm">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-[#f0f2f8] leading-snug mb-2">
                  Never miss a story from DailyPen
                </h3>
                <p className="text-xs sm:text-sm text-gray-400 dark:text-[#555d74] mb-5 leading-relaxed">
                  Join our curated reading community — get the week's best stories and writing tips delivered to your inbox.
                </p>

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const email = e.target.email.value;
                    if (email) {
                      toast.success('Thank you for subscribing to DailyPen!');
                      e.target.reset();
                    }
                  }}
                  className="flex flex-col sm:flex-row gap-2 max-w-md"
                >
                  <input
                    type="email"
                    name="email"
                    placeholder="your@email.com"
                    required
                    className="dp-input flex-1"
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5
                               bg-amber-500 hover:bg-amber-400
                               text-white font-semibold text-sm
                               rounded-xl transition-colors shadow-sm whitespace-nowrap"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
            </div>

          </section>

          {/* ================= RIGHT SIDEBAR WIDGETS ================= */}
          <aside className="hidden lg:flex lg:col-span-3 xl:col-span-3 flex-col space-y-5 sticky top-24 self-start">
            
            {/* Suggested Writers Widget */}
            {suggestedWriters.length > 0 && (
              <div className="widget-card">
                <h3 className="text-[10px] font-bold text-gray-400 dark:text-[#4b5063] uppercase tracking-widest mb-4">
                  Suggested Writers
                </h3>
                <div className="space-y-4">
                  {suggestedWriters.slice(0, 4).map((writer) => {
                    const isFollowing = followedWriters.includes(writer._id);
                    return (
                      <div key={writer._id} className="flex items-center justify-between min-w-0">
                        <Link 
                          to={`/profile/${writer._id}`} 
                          className="flex items-center space-x-2.5 min-w-0 group"
                        >
                          {writer.avatar ? (
                            <img 
                              src={writer.avatar} 
                              alt={writer.name} 
                              className="h-8 w-8 rounded-full object-cover border border-gray-100 dark:border-white/[0.07] group-hover:scale-105 transition-transform duration-200" 
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-800 dark:bg-[#1c1f2b] flex items-center justify-center text-white font-bold text-xs flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                              {writer.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-gray-800 dark:text-[#c8d0e0] truncate group-hover:text-gray-900 dark:group-hover:text-[#f0f2f8] transition-colors">
                              {writer.name}
                            </h4>
                            <p className="text-[10px] text-gray-400 dark:text-[#4b5063] truncate max-w-[110px] mt-0.5">
                              {writer.bio || 'Author on DailyPen'}
                            </p>
                          </div>
                        </Link>
                        
                        <button
                          onClick={() => handleFollowToggle(writer._id)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all duration-200 border flex-shrink-0 ${
                            isFollowing
                              ? 'text-gray-400 dark:text-[#555d74] border-gray-200 dark:border-white/[0.08] hover:text-red-400 hover:border-red-300 dark:hover:border-red-500/30'
                              : 'text-gray-700 dark:text-[#c8d0e0] bg-white dark:bg-[#1c1f2b] border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-[#252836]'
                          }`}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Trending Tags Widget */}
            {topTags.length > 0 && (
              <div className="widget-card">
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="text-[10px] font-bold text-gray-400 dark:text-[#4b5063] uppercase tracking-widest">
                    Trending Tags
                  </h3>
                  {selectedTag && (
                    <button 
                      onClick={clearFilters}
                      className="text-[10px] text-gray-400 dark:text-[#555d74] hover:text-gray-700 dark:hover:text-[#8891a8] transition-colors"
                    >
                      View All
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {topTags.map((tag) => {
                    const isSelected = selectedTag === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className={isSelected ? 'tag-pill-active' : 'tag-pill'}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Popular Reads Widget */}
            {featuredPosts.length > 0 && (
              <div className="widget-card">
                <h3 className="text-[10px] font-bold text-gray-400 dark:text-[#4b5063] uppercase tracking-widest mb-4">
                  Popular Reads
                </h3>
                <div className="space-y-4">
                  {featuredPosts.slice(0, 3).map((post, idx) => (
                    <div key={post._id} className="flex space-x-3 items-start min-w-0">
                      <span className="text-xl font-black font-sans text-gray-200 dark:text-[#252836] leading-none flex-shrink-0 w-5 pt-0.5">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <Link 
                          to={`/profile/${post.author?._id}`}
                          className="text-[10px] font-semibold text-gray-400 dark:text-[#555d74] hover:text-gray-700 dark:hover:text-[#8891a8] truncate block transition-colors"
                        >
                          {post.author?.name}
                        </Link>
                        <Link 
                          to={`/post/${post._id}`}
                          className="text-xs font-semibold text-gray-800 dark:text-[#c8d0e0] leading-snug hover:text-gray-600 dark:hover:text-[#f0f2f8] transition-colors duration-150 mt-0.5 block line-clamp-2"
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
            <div className="px-1 text-[10px] text-gray-300 dark:text-[#2e3347] font-medium">
              <p className="flex items-center space-x-1.5">
                <span>DailyPen</span>
                <span>·</span>
                <span>© 2026</span>
              </p>
            </div>

          </aside>

        </div>
      </main>

      {/* ================= MOBILE BOTTOM STICKY NAVIGATION BAR ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/97 dark:bg-[#0c0e14]/97 border-t border-gray-100 dark:border-white/[0.05] backdrop-blur-md z-40 px-6 py-3 flex items-center justify-between shadow-lg dark:shadow-black/50 transition-colors duration-300">
        <button 
          onClick={() => handleTabChange('for-you')}
          className={`flex flex-col items-center justify-center space-y-0.5 transition-all duration-200 ${
            activeTab === 'for-you' && !selectedTag && !searchQuery
              ? 'text-gray-900 dark:text-amber-400 scale-105'
              : 'text-gray-400 dark:text-[#4b5063] hover:text-gray-600 dark:hover:text-[#8891a8]'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[9px] font-semibold">Home</span>
        </button>

        <button 
          onClick={() => handleTabChange('bookmarks')}
          className={`flex flex-col items-center justify-center space-y-0.5 transition-all duration-200 ${
            activeTab === 'bookmarks'
              ? 'text-gray-900 dark:text-amber-400 scale-105'
              : 'text-gray-400 dark:text-[#4b5063] hover:text-gray-600 dark:hover:text-[#8891a8]'
          }`}
        >
          <Bookmark className="h-5 w-5" />
          <span className="text-[9px] font-semibold">Saved</span>
        </button>

        <button 
          onClick={() => setActiveTab('following')}
          className={`flex flex-col items-center justify-center space-y-0.5 transition-all duration-200 ${
            activeTab === 'following'
              ? 'text-gray-900 dark:text-amber-400 scale-105'
              : 'text-gray-400 dark:text-[#4b5063] hover:text-gray-600 dark:hover:text-[#8891a8]'
          }`}
        >
          <Users className="h-5 w-5" />
          <span className="text-[9px] font-semibold">Following</span>
        </button>

        <Link 
          to="/create-post"
          className="flex flex-col items-center justify-center space-y-0.5 text-gray-400 dark:text-[#4b5063] hover:text-gray-600 dark:hover:text-[#8891a8] transition-colors duration-200"
        >
          <PenSquare className="h-5 w-5" />
          <span className="text-[9px] font-semibold">Write</span>
        </Link>

        {user && (
          <Link 
            to={`/profile/${user._id}`}
            className="flex flex-col items-center justify-center space-y-0.5 text-gray-400 dark:text-[#4b5063] hover:text-gray-600 dark:hover:text-[#8891a8] transition-colors duration-200"
          >
            <User className="h-5 w-5" />
            <span className="text-[9px] font-semibold">Profile</span>
          </Link>
        )}
      </nav>

      {/* Spacing element at bottom to avoid bottom nav overlay */}
      <div className="md:hidden h-16"></div>

      <div className="hidden md:block">
        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;