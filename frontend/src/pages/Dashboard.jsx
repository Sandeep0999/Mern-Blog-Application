import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PostCard from '../components/PostCard';
import API from '../api/axios';
import { toast } from 'react-toastify';
import { Loader2, TrendingUp, Clock, Heart, MessageCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedPosts, setSavedPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('recent');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchPosts(1);
    if (user) {
      fetchSavedPosts();
    }
  }, [activeFilter]);

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
      setCurrentPage(1);
      fetchPosts(1);
      return;
    }

    setSearchQuery(query);
    setLoading(true);

    try {
      const { data } = await API.get(`/posts/search/${query}`);
      setPosts(data);
      setHasMore(false); // Disable load more for search results
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setSearchQuery('');
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
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleSave = async (postId) => {
    try {
      const { data } = await API.put(`/users/save/${postId}`);
      setSavedPosts(data.savedPosts);
      toast.success(
        savedPosts.includes(postId) ? 'Post unsaved' : 'Post saved'
      );
    } catch (error) {
      toast.error('Failed to save post');
    }
  };

  const filters = [
    { id: 'recent', label: 'Most Recent', icon: Clock },
    { id: 'liked', label: 'Most Liked', icon: Heart },
    { id: 'commented', label: 'Most Commented', icon: MessageCircle },
    { id: 'oldest', label: 'Oldest', icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar showSearch onSearch={handleSearch} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-900" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar showSearch onSearch={handleSearch} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!searchQuery && (
          <div className="text-center mb-12 py-8">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Your own blogging platform.
            </h1>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              This is your space to think out loud, to share what matters, and to write without filters. 
              Whether it's one word or a thousand, your story starts right here.
            </p>
          </div>
        )}

        {searchQuery && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Search results for "{searchQuery}"
            </h2>
            <p className="text-gray-600">{posts.length} posts found</p>
          </div>
        )}

        {/* Filter Buttons */}
        {!searchQuery && (
          <div className="mb-8">
            <div className="flex flex-wrap gap-3 justify-center">
              {filters.map((filter) => {
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.id}
                    onClick={() => handleFilterChange(filter.id)}
                    className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                      activeFilter === filter.id
                        ? 'bg-gray-900 text-white shadow-md'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{filter.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No posts found
            </h3>
            <p className="text-gray-600">
              {searchQuery
                ? 'Try searching with different keywords'
                : 'Be the first to create a post!'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
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

            {/* Load More Button */}
            {!searchQuery && hasMore && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex items-center space-x-2 bg-gray-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  {loadingMore ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading...</span>
                    </>
                  ) : (
                    <>
                      <span>Load More Posts</span>
                      <span className="text-sm text-gray-300">
                        ({currentPage} of {totalPages})
                      </span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Newsletter Subscription Section */}
        <div className="mt-16 bg-gray-900 text-white rounded-2xl p-8 md:p-12">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Never Miss a Blog!
            </h2>
            <p className="text-gray-300 text-lg mb-8">
              Subscribe to get the latest blog, new tech, and exclusive news.
            </p>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const email = e.target.email.value;
                if (email) {
                  toast.success('Thank you for subscribing!');
                  e.target.reset();
                }
              }}
              className="flex flex-col sm:flex-row gap-3 justify-center items-center"
            >
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                required
                className="w-full sm:flex-1 px-5 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors shadow-md hover:shadow-lg whitespace-nowrap"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;