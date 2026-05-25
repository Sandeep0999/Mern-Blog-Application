import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PostCard from '../components/PostCard';
import API from '../api/axios';
import { toast } from 'react-toastify';
import { 
  Edit, Save, X, Loader2, FileText, Bookmark, 
  Camera, Calendar, Mail, Award
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Profile = () => {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('posts');
  const [formData, setFormData] = useState({ name: '', bio: '', avatar: '' });
  const [avatarPreview, setAvatarPreview] = useState('');

  const isOwnProfile = user && user._id === id;

  useEffect(() => {
    fetchProfile();
    if (isOwnProfile) fetchSavedPosts();
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
    if (!file) return;
    if (file.size > 5000000) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, avatar: reader.result }));
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await API.put('/users/profile', formData);
      setProfile(data);
      updateUser(data);
      setEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      await API.put(`/posts/${postId}/like`);
      if (activeTab === 'posts') fetchProfile();
      else fetchSavedPosts();
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

  const formatJoinDate = (date) => {
    try {
      return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-300">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-gray-900 dark:text-white" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Loading profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const displayedPosts = activeTab === 'posts' ? posts : savedPosts;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">

        {/* ═══════════════════════════════════════════════════════
            PROFILE HEADER CARD
            ═══════════════════════════════════════════════════════ */}
        <div className="relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden mb-6">

          {/* Gradient Banner */}
          <div className="h-28 sm:h-36 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 dark:from-gray-800 dark:via-gray-900 dark:to-black relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.2),transparent_70%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.2),transparent_70%)]" />
          </div>

          {/* Content Area below banner */}
          <div className="px-6 pb-6">
            {/* Avatar — overlaps banner */}
            <div className="flex items-end justify-between -mt-12 mb-4">
              <div className="relative flex-shrink-0">
                {editing ? (
                  <>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label htmlFor="avatar-upload" className="cursor-pointer block group">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Avatar"
                          className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-lg"
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-3xl font-black border-4 border-white dark:border-gray-900 shadow-lg">
                          {formData.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                    </label>
                  </>
                ) : profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="h-24 w-24 rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-lg"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-3xl font-black border-4 border-white dark:border-gray-900 shadow-lg">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Edit / Save buttons */}
              {isOwnProfile && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Profile
                </button>
              )}
            </div>

            {/* Name / Bio / Edit form */}
            {editing ? (
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-850/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={3}
                    maxLength={200}
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-850/40 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-400 resize-none transition"
                    placeholder="Tell readers about yourself..."
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{formData.bio.length}/200</p>
                </div>
                <div className="flex gap-2.5">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2 rounded-full text-xs font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setFormData({ name: profile.name, bio: profile.bio || '', avatar: profile.avatar || '' });
                      setAvatarPreview(profile.avatar || '');
                    }}
                    className="flex items-center gap-1.5 border border-gray-200 dark:border-gray-700 px-5 py-2 rounded-full text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                    {profile.name}
                  </h1>
                  {profile.role === 'admin' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-[10px] font-bold rounded-full border border-violet-200 dark:border-violet-800">
                      <Award className="h-3 w-3" />
                      Admin
                    </span>
                  )}
                </div>
                {profile.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3 max-w-lg">
                    {profile.bio}
                  </p>
                )}

                {/* Meta info row */}
                <div className="flex flex-wrap gap-4 text-xs text-gray-400 dark:text-gray-500 font-medium">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    {profile.email}
                  </span>
                  {profile.createdAt && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Joined {formatJoinDate(profile.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stats strip */}
          {!editing && (
            <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex gap-8">
              <div>
                <p className="text-xl font-black text-gray-900 dark:text-white">{posts.length}</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Posts</p>
              </div>
              {isOwnProfile && (
                <div>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{savedPosts.length}</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Saved</p>
                </div>
              )}
              <div>
                <p className="text-xl font-black text-gray-900 dark:text-white">
                  {posts.reduce((acc, p) => acc + (p.likesCount || 0), 0)}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Likes</p>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════
            TABS (Own profile only)
            ═══════════════════════════════════════════════════════ */}
        {isOwnProfile && (
          <div className="flex border-b border-gray-100 dark:border-gray-800 mb-6">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'posts'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <FileText className="h-4 w-4" />
              My Posts
              {posts.length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'posts' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                  {posts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'saved'
                  ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Bookmark className="h-4 w-4" />
              Saved Posts
              {savedPosts.length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'saved' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                }`}>
                  {savedPosts.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════
            POSTS FEED LIST
            ═══════════════════════════════════════════════════════ */}
        <div>
          {displayedPosts.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900/10">
              {activeTab === 'saved' ? (
                <>
                  <Bookmark className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">No saved posts</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Posts you bookmark will appear here
                  </p>
                  <Link
                    to="/dashboard"
                    className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition"
                  >
                    Browse stories
                  </Link>
                </>
              ) : (
                <>
                  <FileText className="h-10 w-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                    {isOwnProfile ? 'No posts yet' : 'No posts published'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isOwnProfile
                      ? 'Your published stories will appear here.'
                      : "This writer hasn't published any posts yet."}
                  </p>
                  {isOwnProfile && (
                    <Link
                      to="/create-post"
                      className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition"
                    >
                      Write your first post
                    </Link>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
              {displayedPosts.map((post, idx) => (
                <div key={post._id} className={idx !== 0 ? 'border-t border-gray-100 dark:border-gray-800' : ''}>
                  <PostCard
                    post={post}
                    onLike={handleLike}
                    onSave={handleSave}
                    isLiked={post.likes?.includes(user?._id)}
                    isSaved={savedPosts.some((p) => p._id === post._id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default Profile;