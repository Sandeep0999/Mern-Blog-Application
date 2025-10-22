import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PostCard from '../components/PostCard';
import API from '../api/axios';
import { toast } from 'react-toastify';
import { Edit, Save, X, Loader2, FileText, Bookmark } from 'lucide-react';

const Profile = () => {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    avatar: '',
  });
  const [avatarPreview, setAvatarPreview] = useState('');

  const isOwnProfile = user && user._id === id;

  useEffect(() => {
    fetchProfile();
    if (isOwnProfile) {
      fetchSavedPosts();
    }
  }, [id]);

  const fetchProfile = async () => {
    try {
      const { data } = await API.get(`/users/profile/${id}`);
      setProfile(data.user);
      setPosts(data.posts);
      setFormData({
        name: data.user.name,
        bio: data.user.bio || '',
        avatar: data.user.avatar || '',
      });
      setAvatarPreview(data.user.avatar || '');
    } catch (error) {
      toast.error('Failed to fetch profile');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedPosts = async () => {
    try {
      const { data } = await API.get('/users/saved');
      setSavedPosts(data);
    } catch (error) {
      console.error('Failed to fetch saved posts');
    }
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          avatar: reader.result,
        });
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data } = await API.put('/users/profile', formData);
      setProfile(data);
      updateUser(data);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleLike = async (postId) => {
    try {
      await API.put(`/posts/${postId}/like`);
      // Refresh posts
      if (activeTab === 'posts') {
        fetchProfile();
      } else {
        fetchSavedPosts();
      }
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleSave = async (postId) => {
    try {
      await API.put(`/users/save/${postId}`);
      fetchSavedPosts();
      toast.success('Post saved/unsaved');
    } catch (error) {
      toast.error('Failed to save post');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-900" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              {editing ? (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="cursor-pointer block"
                  >
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Avatar"
                        className="h-32 w-32 rounded-full object-cover border-4 border-gray-200"
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-full bg-gray-900 flex items-center justify-center text-white text-4xl font-bold border-4 border-gray-200">
                        {formData.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 bg-gray-900 text-white p-2 rounded-full">
                      <Edit className="h-4 w-4" />
                    </div>
                  </label>
                </div>
              ) : profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="h-32 w-32 rounded-full object-cover border-4 border-gray-200"
                />
              ) : (
                <div className="h-32 w-32 rounded-full bg-gray-900 flex items-center justify-center text-white text-4xl font-bold border-4 border-gray-200">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              {editing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      rows={3}
                      maxLength={200}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                      placeholder="Tell us about yourself..."
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.bio.length}/200 characters
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      className="flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          name: profile.name,
                          bio: profile.bio || '',
                          avatar: profile.avatar || '',
                        });
                        setAvatarPreview(profile.avatar || '');
                      }}
                      className="flex items-center space-x-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {profile.name}
                    </h1>
                    {profile.role === 'admin' && (
                      <span className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                        Admin
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">{profile.email}</p>
                  {profile.bio && (
                    <p className="text-gray-700 mb-4">{profile.bio}</p>
                  )}
                  <div className="flex items-center justify-center md:justify-start space-x-6 text-sm text-gray-600">
                    <span>
                      <strong className="text-gray-900">{posts.length}</strong>{' '}
                      Posts
                    </span>
                  </div>
                  {isOwnProfile && (
                    <button
                      onClick={() => setEditing(true)}
                      className="mt-4 flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors mx-auto md:mx-0"
                    >
                      <Edit className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        {isOwnProfile && (
          <div className="bg-white rounded-lg shadow-md mb-8">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 font-medium transition-colors ${
                  activeTab === 'posts'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span>My Posts</span>
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex-1 flex items-center justify-center space-x-2 py-4 font-medium transition-colors ${
                  activeTab === 'saved'
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Bookmark className="h-5 w-5" />
                <span>Saved Posts</span>
              </button>
            </div>
          </div>
        )}

        {/* Posts Grid */}
        <div>
          {activeTab === 'posts' ? (
            posts.length === 0 ? (
              <div className="text-center py-20">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No posts yet
                </h3>
                <p className="text-gray-600">
                  {isOwnProfile
                    ? 'Start writing your first post!'
                    : 'This user hasn\'t published any posts yet.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onLike={handleLike}
                    onSave={handleSave}
                    isLiked={post.likes?.includes(user?._id)}
                    isSaved={savedPosts.some((p) => p._id === post._id)}
                  />
                ))}
              </div>
            )
          ) : (
            savedPosts.length === 0 ? (
              <div className="text-center py-20">
                <Bookmark className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No saved posts
                </h3>
                <p className="text-gray-600">
                  Posts you save will appear here
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedPosts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onLike={handleLike}
                    onSave={handleSave}
                    isLiked={post.likes?.includes(user?._id)}
                    isSaved={true}
                  />
                ))}
              </div>
            )
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;