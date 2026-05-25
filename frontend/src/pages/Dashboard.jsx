import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PostCard from '../components/PostCard';
import API from '../api/axios';
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
  const { user } = useAuth();
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
  const [followedWriters, setFollowedWriters] = useState(() => {
    try {
      const saved = localStorage.getItem('followed_writers');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Fetch posts when activeFilter or activeTab changes
  useEffect(() => {
    if (activeTab === 'for-you') {
      fetchPosts(1);
    }
    if (user) {
      fetchSavedPosts();
    }
  }, [activeFilter, activeTab]);

  // Sync followed writers to localStorage
  useEffect(() => {
    localStorage.setItem('followed_writers', JSON.stringify(followedWriters));
  }, [followedWriters]);

  // Fetch featured posts once on mount for right sidebar
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const { data } = await API.get('/posts/featured');
        setFeaturedPosts(data);
      } catch (err) {
        console.error('Failed to fetch featured posts');
      }
    };
    fetchFeatured();
  }, []);

  const fetchPosts = async (page = 1) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const { data } = await API.get(`/posts?sortBy=${activeFilter}&page=${page}&limit=9`);
      
      if (page === 1) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }
      
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      setHasMore(data.currentPage < data.totalPages);
    } catch (error) {
      toast.error('Failed to fetch posts');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const { data } = await API.get('/users/saved');
      setSavedPosts(data.map((post) => post._id));
    } catch (error) {
      console.error('Failed to fetch saved posts');
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
      toast.error('Search failed');
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
      setPosts(
        posts.map((post) =>
          post._id === postId
            ? { ...post, likesCount: data.likesCount, likes: data.likes }
            : post
        )
      );
      // Synchronize featured posts as well
      setFeaturedPosts(
        featuredPosts.map((post) =>
          post._id === postId
            ? { ...post, likesCount: data.likesCount, likes: data.likes }
            : post
        )
      );
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleSave = async (postId) => {
    try {
      const { data } = await API.put(`/users/save/${postId}`);
      setSavedPosts(data.savedPosts);
      toast.success(
        savedPosts.includes(postId) ? 'Post removed from Bookmarks' : 'Post saved to Bookmarks'
      );
      
      // If we are currently viewing bookmarks, remove the unsaved item from view immediately
      if (activeTab === 'bookmarks') {
        setPosts(prev => prev.filter(post => post._id !== postId));
      }
    } catch (error) {
      toast.error('Failed to save post');
    }
  };

  const handleFollowToggle = (authorId) => {
    if (followedWriters.includes(authorId)) {
      setFollowedWriters(prev => prev.filter(id => id !== authorId));
      toast.success('Unfollowed author');
    } else {
      setFollowedWriters(prev => [...prev, authorId]);
      toast.success('Author followed');
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
      toast.error('Failed to load posts for tag');
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
        toast.error('Failed to load featured posts');
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
        toast.error('Failed to load saved posts');
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
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-300">
        <Navbar showSearch onSearch={handleSearch} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-gray-900 dark:text-white" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading your reading feed...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar showSearch onSearch={handleSearch} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ================= LEFT SIDEBAR (STICKY NAVIGATION) ================= */}
          <aside className="hidden md:flex md:col-span-3 lg:col-span-2 flex-col space-y-1.5 sticky top-24 self-start border-r border-gray-100 dark:border-gray-800/80 pr-4 xl:pr-6">
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
              <Link to="/admin" className="sidebar-link text-red-600 dark:text-red-400">
                <Shield className="h-5 w-5" />
                <span>Admin</span>
              </Link>
            )}
          </aside>

          {/* ================= CENTER FEED AREA ================= */}
          <section className="col-span-1 md:col-span-9 lg:col-span-7 xl:col-span-7 space-y-6">
            
            {/* Category and Filter Navigation Tabs */}
            <div className="border-b border-gray-100 dark:border-gray-800/80 pb-3 flex items-center justify-between">
              <div className="flex items-center space-x-6 overflow-x-auto pb-1 scrollbar-none">
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

              {/* Sparkle decoration */}
              <div className="hidden sm:flex items-center space-x-1.5 text-xs text-amber-500 font-medium px-2.5 py-1 rounded-full bg-amber-500/5 border border-amber-500/10">
                <Sparkles className="h-3.5 w-3.5 fill-current" />
                <span>Premium View</span>
              </div>
            </div>

            {/* Sub-Filters: Sort buttons (Only for "For You" tab when no search/tag filter is active) */}
            {activeTab === 'for-you' && !searchQuery && !selectedTag && (
              <div className="flex flex-wrap gap-2 pt-1 pb-2">
                {sortingFilters.map((filter) => {
                  const Icon = filter.icon;
                  const isActive = activeFilter === filter.id;
                  return (
                    <button
                      key={filter.id}
                      onClick={() => handleFilterChange(filter.id)}
                      className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gray-900 text-white dark:bg-gray-150 dark:text-gray-950 shadow-sm'
                          : 'bg-gray-50 text-gray-600 dark:bg-gray-900/50 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800/60'
                      }`}
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
              <div className="flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 p-4 rounded-xl">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {searchQuery ? `Search results for "${searchQuery}"` : `Feed filtered by tag: #${selectedTag}`}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Found {displayedPosts.length} matches
                  </p>
                </div>
                <button
                  onClick={clearFilters}
                  className="text-xs font-bold text-gray-900 dark:text-white bg-white dark:bg-gray-800 hover:bg-gray-50 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg transition"
                >
                  Clear filter
                </button>
              </div>
            )}

            {/* Main Feed Content List */}
            {displayedPosts.length === 0 ? (
              activeTab === 'following' ? (
                // Elegant empty state for Following tab
                <div className="text-center py-16 px-6 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900/10 max-w-md mx-auto animate-fadeIn">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800/80 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-gray-800">
                    <Users className="h-7 w-7 text-gray-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    Personalize your reading experience
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                    Follow writers to populate your feed with their latest stories. Find active users in the suggestions panel.
                  </p>
                  
                  {suggestedWriters.length > 0 && (
                    <div className="text-left space-y-2.5 max-w-xs mx-auto">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 text-center">
                        Active Writers to Follow
                      </p>
                      {suggestedWriters.slice(0, 3).map((writer) => (
                        <div key={writer._id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800/80">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            {writer.avatar ? (
                              <img src={writer.avatar} alt={writer.name} className="h-7 w-7 rounded-full object-cover" />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-gray-900 dark:bg-gray-800 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                {writer.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{writer.name}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleFollowToggle(writer._id)}
                            className="text-[10px] font-bold text-gray-900 dark:text-white px-2.5 py-1 bg-white dark:bg-gray-900 hover:bg-gray-50 border border-gray-200 dark:border-gray-700 rounded-full transition flex items-center space-x-1"
                          >
                            <span>Follow</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                // General empty state
                <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-900/10 border border-gray-150 dark:border-gray-850 rounded-2xl">
                  <BookOpen className="h-10 w-10 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                    No articles found
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    {searchQuery 
                      ? 'No results matched your search terms.' 
                      : 'Be the first writer to publish an article on DailyPen!'}
                  </p>
                  {(searchQuery || selectedTag) && (
                    <button
                      onClick={clearFilters}
                      className="mt-4 text-xs font-bold text-gray-900 dark:text-white px-4 py-2 bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-55 transition"
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
              <div className="mt-8 pt-4 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center space-x-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-900 dark:text-white px-6 py-2.5 rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-xs"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading more...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Stories</span>
                      <span className="text-gray-400 text-[10px]">
                        ({currentPage} of {totalPages})
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ================= NEWSLETTER CARD (Polished & Content-aligned) ================= */}
            <div className="mt-12 bg-gray-50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 sm:p-8 relative overflow-hidden transition-all duration-300 hover:shadow-sm">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-gray-900/5 dark:bg-white/5 rounded-full blur-xl pointer-events-none"></div>
              
              <div className="relative max-w-xl">
                <div className="inline-flex items-center justify-center p-2 bg-gray-900 dark:bg-gray-800 text-white rounded-lg mb-4">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight">
                  Never miss an update from DailyPen
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 mb-6 leading-relaxed">
                  Join our curated reading community to get the week's most liked stories, new tech insight, and writing recommendations delivered directly to your inbox.
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
                    placeholder="Enter your email address"
                    required
                    className="w-full px-4 py-2.5 text-sm bg-white dark:bg-gray-850 text-gray-900 dark:text-white placeholder-gray-400 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-300"
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-5 py-2.5 bg-gray-900 dark:bg-gray-150 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-950 font-semibold text-sm rounded-xl transition shadow-sm whitespace-nowrap"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
            </div>

          </section>

          {/* ================= RIGHT SIDEBAR WIDGETS ================= */}
          <aside className="hidden lg:flex lg:col-span-3 xl:col-span-3 flex-col space-y-6 sticky top-24 self-start">
            
            {/* Suggested Writers Widget */}
            {suggestedWriters.length > 0 && (
              <div className="widget-card">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Suggested Writers
                </h3>
                <div className="space-y-3.5">
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
                              className="h-8 w-8 rounded-full object-cover border border-gray-100 dark:border-gray-800" 
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-gray-900 dark:bg-gray-800 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 group-hover:scale-105 transition-transform">
                              {writer.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-gray-800 dark:text-gray-250 truncate group-hover:text-gray-900 dark:group-hover:text-white">
                              {writer.name}
                            </h4>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
                              {writer.bio || 'Author on DailyPen'}
                            </p>
                          </div>
                        </Link>
                        
                        <button
                          onClick={() => handleFollowToggle(writer._id)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all duration-200 border ${
                            isFollowing
                              ? 'bg-transparent text-gray-400 border-gray-200 dark:border-gray-800 hover:text-red-500 hover:border-red-200 hover:bg-red-50/5'
                              : 'bg-white dark:bg-gray-800 text-gray-950 dark:text-gray-100 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Trending Tags
                  </h3>
                  {selectedTag && (
                    <button 
                      onClick={clearFilters}
                      className="text-[10px] text-gray-500 dark:text-gray-400 hover:underline"
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
                        className={`text-[11px] px-2.5 py-1 rounded-full transition-all border duration-200 ${
                          isSelected
                            ? 'bg-gray-900 text-white border-gray-900 dark:bg-gray-150 dark:text-gray-950 dark:border-gray-150'
                            : 'bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 border-gray-100 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommended Reads (Popular posts) */}
            {featuredPosts.length > 0 && (
              <div className="widget-card">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                  Popular Reads
                </h3>
                <div className="space-y-4">
                  {featuredPosts.slice(0, 3).map((post, idx) => (
                    <div key={post._id} className="flex space-x-3 items-start min-w-0">
                      <span className="text-2xl font-bold font-sans text-gray-200 dark:text-gray-850 leading-none">
                        0{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <Link 
                          to={`/profile/${post.author?._id}`}
                          className="text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white truncate block"
                        >
                          {post.author?.name}
                        </Link>
                        <Link 
                          to={`/post/${post._id}`}
                          className="text-xs font-bold text-gray-900 dark:text-white leading-tight hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150 mt-0.5 block line-clamp-2"
                        >
                          {post.title}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer rights note for Premium layout */}
            <div className="px-4 text-[10px] text-gray-400 dark:text-gray-600 font-medium">
              <p className="flex items-center space-x-1.5">
                <span>DailyPen Reading Platform</span>
                <span>•</span>
                <span>© 2026</span>
              </p>
            </div>

          </aside>

        </div>
      </main>

      {/* ================= MOBILE BOTTOM STICKY NAVIGATION BAR ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-950/95 border-t border-gray-150 dark:border-gray-800/80 backdrop-blur-md z-40 px-6 py-3 flex items-center justify-between shadow-lg transition-colors duration-300">
        <button 
          onClick={() => handleTabChange('for-you')}
          className={`flex flex-col items-center justify-center space-y-1 transition ${
            activeTab === 'for-you' && !selectedTag && !searchQuery ? 'text-gray-900 dark:text-white scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="text-[9px] font-semibold">Home</span>
        </button>

        <button 
          onClick={() => handleTabChange('bookmarks')}
          className={`flex flex-col items-center justify-center space-y-1 transition ${
            activeTab === 'bookmarks' ? 'text-gray-900 dark:text-white scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
          }`}
        >
          <Bookmark className="h-5 w-5" />
          <span className="text-[9px] font-semibold">Saved</span>
        </button>

        <button 
          onClick={() => setActiveTab('following')}
          className={`flex flex-col items-center justify-center space-y-1 transition ${
            activeTab === 'following' ? 'text-gray-900 dark:text-white scale-105' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'
          }`}
        >
          <Users className="h-5 w-5" />
          <span className="text-[9px] font-semibold">Following</span>
        </button>

        <Link 
          to="/create-post"
          className="flex flex-col items-center justify-center space-y-1 text-gray-400 dark:text-gray-500 hover:text-gray-600"
        >
          <PenSquare className="h-5 w-5" />
          <span className="text-[9px] font-semibold">Write</span>
        </Link>

        {user && (
          <Link 
            to={`/profile/${user._id}`}
            className="flex flex-col items-center justify-center space-y-1 text-gray-400 dark:text-gray-500 hover:text-gray-600"
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