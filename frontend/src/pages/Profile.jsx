import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PostCard from '../components/PostCard';
import API, { isSilentError, logDebug } from '../api/axios';
import { toast } from 'react-toastify';
import { 
  Edit, Save, X, Loader2, FileText, Bookmark, 
  Camera, Calendar, Mail, Award, AlertTriangle
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
    logDebug('Profile', `Mounting Profile page for id: ${id}`);
    const controller = new AbortController();
    fetchProfile(controller.signal);
    if (isOwnProfile) fetchSavedPosts(controller.signal);
    return () => {
      logDebug('Profile', `Unmounting/Aborting Profile page for id: ${id}`);
      controller.abort();
    };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfile = async (signal) => {
    try {
      logDebug('Profile', `[START] Fetching profile from server for id: ${id}`);
      
      const { data } = await API.get(`/users/profile/${id}`, { signal });
      
      logDebug('Profile', `[SUCCESS] Profile loaded for: ${data.user?.name}`, data.user);
      setProfile(data.user);
      setPosts(data.posts);
      setFormData({
        name: data.user.name,
        bio: data.user.bio || '',
        avatar: data.user.avatar || '',
      });
      setAvatarPreview(data.user.avatar || '');
    } catch (error) {
      logDebug('Profile', `[ERROR] Failed to load profile:`, error);
      if (isSilentError(error)) {
        logDebug('Profile', 'Silenced profile error based on global interceptor rules.');
        return;
      }
      toast.error('Failed to fetch profile', { toastId: 'profile-error' });
      navigate('/dashboard');
    } finally {
      logDebug('Profile', '[COMPLETE] Fetch profile request complete.');
      setLoading(false);
    }
  };

  const fetchSavedPosts = async (signal) => {
    try {
      const { data } = await API.get('/users/saved', { signal });
      setSavedPosts(data);
    } catch (error) {
      if (!isSilentError(error)) console.error('Failed to fetch saved posts:', error.message);
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

  const handleFollowToggle = async (authorId) => {
    try {
      const { data } = await API.put(`/users/profile/follow/${authorId}`);
      updateUser({ following: data.currentUserFollowing });
      
      // Dynamic inline update of the current profiled user's followers list to avoid full page refresh
      setProfile((prev) => ({
        ...prev,
        followers: data.isFollowing
          ? [...(prev.followers || []), user._id]
          : (prev.followers || []).filter((id) => id !== user._id),
      }));

      toast.success(data.isFollowing ? 'Author followed' : 'Unfollowed author');
    } catch (error) {
      toast.error('Failed to toggle follow status');
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
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#0c0e14] transition-colors duration-300">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-9 w-9 animate-spin text-gray-400 dark:text-amber-400" />
            <p className="text-sm font-medium text-gray-400 dark:text-[#555d74]">Loading profile...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) {
    logDebug('Profile', '[RENDER FALLBACK] Profile is null, rendering defensive error state.');
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-[#0c0e14] transition-colors duration-300">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4 max-w-md text-center px-6 py-12 bg-white dark:bg-[#161820] border border-gray-100 dark:border-white/[0.06] rounded-2xl shadow-sm">
            <div className="p-3 bg-amber-500/10 rounded-full">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-[#f0f2f8]">Profile Unavailable</h3>
            <p className="text-xs text-gray-400 dark:text-[#555d74] leading-relaxed">
              We encountered an issue loading this writer's profile. Please verify your connection or click below to retry.
            </p>
            <button
              onClick={() => {
                logDebug('Profile', '[RETRY] Retrying profile fetch manually...');
                fetchProfile();
              }}
              className="mt-2 text-xs font-bold px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors shadow-sm"
            >
              Retry Connection
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const displayedPosts = activeTab === 'posts' ? posts : savedPosts;

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0c0e14] transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">

        {/* ═══════════════════════════════════════════════════════
            PROFILE HEADER CARD
            ═══════════════════════════════════════════════════════ */}
        <div className="relative bg-white dark:bg-[#111318] border border-gray-100 dark:border-white/[0.06] rounded-2xl shadow-sm overflow-hidden mb-6">

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

              {/* Edit / Save / Follow buttons */}
              {isOwnProfile && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Profile
                </button>
              )}
              {!isOwnProfile && user && (
                <button
                  onClick={() => handleFollowToggle(id)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-5 py-2 rounded-full transition border ${
                    user.following?.includes(id)
                      ? 'text-gray-400 border-gray-200 dark:border-gray-800 hover:text-red-500 hover:border-red-250 hover:bg-red-50/5'
                      : 'text-white bg-emerald-600 hover:bg-emerald-700 border-emerald-600'
                  }`}
                >
                  {user.following?.includes(id) ? 'Following' : 'Follow'}
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
                    className="dp-input"
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
                    className="dp-input resize-none"
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
                  <h1 className="text-2xl font-black text-gray-900 dark:text-[#f0f2f8] tracking-tight">
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
                  <p className="text-sm text-gray-600 dark:text-[#8891a8] leading-relaxed mb-3 max-w-lg">
                    {profile.bio}
                  </p>
                )}

                {/* Meta info row */}
                <div className="flex flex-wrap gap-4 text-xs text-gray-400 dark:text-[#555d74] font-medium">
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
            <div className="border-t border-gray-100 dark:border-white/[0.05] px-6 py-4 flex flex-wrap gap-8">
              <div>
                <p className="text-xl font-black text-gray-900 dark:text-[#f0f2f8]">{posts.length}</p>
                <p className="text-[11px] text-gray-400 dark:text-[#4b5063] font-semibold uppercase tracking-wider mt-0.5">Posts</p>
              </div>
              {isOwnProfile && (
                <div>
                  <p className="text-xl font-black text-gray-900 dark:text-[#f0f2f8]">{savedPosts.length}</p>
                  <p className="text-[11px] text-gray-400 dark:text-[#4b5063] font-semibold uppercase tracking-wider mt-0.5">Saved</p>
                </div>
              )}
              <div>
                <p className="text-xl font-black text-gray-900 dark:text-[#f0f2f8]">
                  {posts.reduce((acc, p) => acc + (p.likesCount || 0), 0)}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-[#4b5063] font-semibold uppercase tracking-wider mt-0.5">Likes</p>
              </div>
              <div>
                <p className="text-xl font-black text-gray-900 dark:text-[#f0f2f8]">{profile.followers?.length || 0}</p>
                <p className="text-[11px] text-gray-400 dark:text-[#4b5063] font-semibold uppercase tracking-wider mt-0.5">Followers</p>
              </div>
              <div>
                <p className="text-xl font-black text-gray-900 dark:text-[#f0f2f8]">{profile.following?.length || 0}</p>
                <p className="text-[11px] text-gray-400 dark:text-[#4b5063] font-semibold uppercase tracking-wider mt-0.5">Following</p>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════
            TABS (Own profile only)
            ═══════════════════════════════════════════════════════ */}
        {isOwnProfile && (
          <div className="flex border-b border-gray-100 dark:border-white/[0.05] mb-6">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'posts'
                  ? 'border-amber-500 dark:border-amber-400 text-gray-900 dark:text-[#f0f2f8]'
                  : 'border-transparent text-gray-400 dark:text-[#555d74] hover:text-gray-700 dark:hover:text-[#8891a8]'
              }`}
            >
              <FileText className="h-4 w-4" />
              My Posts
              {posts.length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'posts' ? 'bg-amber-500/20 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-gray-100 dark:bg-[#1c1f2b] text-gray-400 dark:text-[#555d74]'
                }`}>
                  {posts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-all border-b-2 ${
                activeTab === 'saved'
                  ? 'border-amber-500 dark:border-amber-400 text-gray-900 dark:text-[#f0f2f8]'
                  : 'border-transparent text-gray-400 dark:text-[#555d74] hover:text-gray-700 dark:hover:text-[#8891a8]'
              }`}
            >
              <Bookmark className="h-4 w-4" />
              Saved Posts
              {savedPosts.length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === 'saved' ? 'bg-amber-500/20 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-gray-100 dark:bg-[#1c1f2b] text-gray-400 dark:text-[#555d74]'
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
            <div className="text-center py-20 border border-dashed border-gray-200 dark:border-white/[0.05] rounded-2xl bg-white dark:bg-[#111318]">
              {activeTab === 'saved' ? (
                <>
                  <Bookmark className="h-9 w-9 text-gray-200 dark:text-[#252836] mx-auto mb-3" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-[#f0f2f8] mb-1">No saved posts</h3>
                  <p className="text-sm text-gray-400 dark:text-[#555d74]">
                    Posts you bookmark will appear here
                  </p>
                  <Link
                    to="/dashboard"
                    className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  >
                    Browse stories
                  </Link>
                </>
              ) : (
                <>
                  <FileText className="h-9 w-9 text-gray-200 dark:text-[#252836] mx-auto mb-3" />
                  <h3 className="text-base font-bold text-gray-900 dark:text-[#f0f2f8] mb-1">
                    {isOwnProfile ? 'No posts yet' : 'No posts published'}
                  </h3>
                  <p className="text-sm text-gray-400 dark:text-[#555d74]">
                    {isOwnProfile
                      ? 'Your published stories will appear here.'
                      : "This writer hasn't published any posts yet."}
                  </p>
                  {isOwnProfile && (
                    <Link
                      to="/create-post"
                      className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                    >
                      Write your first post
                    </Link>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-[#111318] border border-gray-100 dark:border-white/[0.06] rounded-2xl overflow-hidden">
              {displayedPosts.map((post, idx) => (
                <div key={post._id} className={idx !== 0 ? 'border-t border-gray-100 dark:border-white/[0.04]' : ''}>
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