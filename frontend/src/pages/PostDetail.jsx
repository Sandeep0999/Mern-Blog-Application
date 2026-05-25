import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import API from '../api/axios';
import { toast } from 'react-toastify';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Edit,
  Trash2,
  Send,
  Loader2,
  X,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Sparkles
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState(null); // 'post' or 'comment'
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Synced local follow state
  const [followedWriters, setFollowedWriters] = useState(() => {
    try {
      const saved = localStorage.getItem('followed_writers');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    fetchPost();
    fetchComments();
    if (user) {
      checkIfSaved();
    }
  }, [id]);

  useEffect(() => {
    localStorage.setItem('followed_writers', JSON.stringify(followedWriters));
  }, [followedWriters]);

  const fetchPost = async () => {
    try {
      const { data } = await API.get(`/posts/${id}`);
      setPost(data);
    } catch (error) {
      toast.error('Failed to fetch post');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data } = await API.get(`/posts/${id}/comments`);
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments');
    }
  };

  const checkIfSaved = async () => {
    try {
      const { data } = await API.get('/users/saved');
      setIsSaved(data.some((p) => p._id === id));
    } catch (error) {
      console.error('Failed to check saved status');
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please login to like posts');
      return;
    }

    try {
      const { data } = await API.put(`/posts/${id}/like`);
      setPost({
        ...post,
        likesCount: data.likesCount,
        likes: data.likes,
      });
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast.error('Please login to save posts');
      return;
    }

    try {
      await API.put(`/users/save/${id}`);
      setIsSaved(!isSaved);
      toast.success(isSaved ? 'Post removed from Bookmarks' : 'Post saved to Bookmarks');
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

  const openDeleteModal = (type, targetId = null) => {
    setDeleteType(type);
    setDeleteTargetId(targetId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteType(null);
    setDeleteTargetId(null);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    
    try {
      if (deleteType === 'post') {
        await API.delete(`/posts/${id}`);
        toast.success('Post deleted successfully');
        navigate('/dashboard');
      } else if (deleteType === 'comment') {
        await API.delete(`/posts/${id}/comments/${deleteTargetId}`);
        setComments(comments.filter((c) => c._id !== deleteTargetId));
        setPost({
          ...post,
          commentsCount: post.commentsCount - 1,
        });
        toast.success('Comment removed');
        closeDeleteModal();
      }
    } catch (error) {
      toast.error(`Failed to delete ${deleteType}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    if (!commentText.trim()) {
      return;
    }

    setSubmittingComment(true);

    try {
      const { data } = await API.post(`/posts/${id}/comments`, {
        content: commentText,
      });
      setComments([data, ...comments]);
      setCommentText('');
      setPost({
        ...post,
        commentsCount: post.commentsCount + 1,
      });
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-300">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-gray-900 dark:text-white" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Opening reading canvas...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const isLiked = post.likes?.includes(user?._id);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 transition-colors duration-300 select-none">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 md:py-10 animate-fadeIn">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center space-x-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Stories</span>
          </button>
        </div>

        <article className="space-y-6">
          
          {/* ================= TITLE & SUBTITLE ================= */}
          <div className="space-y-3">
            {post.tags && post.tags.length > 0 && (
              <span className="inline-block px-2.5 py-0.5 bg-gray-50 dark:bg-gray-900/60 text-gray-650 dark:text-gray-400 border border-gray-100 dark:border-gray-800 text-[11px] font-bold rounded-full uppercase tracking-wider">
                {post.tags[0]}
              </span>
            )}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-sans font-black tracking-tight text-gray-900 dark:text-white leading-tight">
              {post.title}
            </h1>
            <p className="text-lg sm:text-xl font-sans font-light text-gray-550 dark:text-gray-400 leading-relaxed font-sans">
              {post.subtitle}
            </p>
          </div>

          {/* ================= AUTHOR HEADER & ACTION BAR ================= */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 border-y border-gray-100 dark:border-gray-800/80 gap-4">
            
            {/* Author Profile */}
            <div className="flex items-center space-x-3">
              <Link to={`/profile/${post.author._id}`} className="flex-shrink-0 group">
                {post.author.avatar ? (
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-gray-800 group-hover:scale-102 transition-transform"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gray-900 dark:bg-gray-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 group-hover:scale-102 transition-transform">
                    {post.author.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </Link>
              
              <div>
                <div className="flex items-center">
                  <Link
                    to={`/profile/${post.author._id}`}
                    className="text-sm font-bold text-gray-900 dark:text-white hover:underline leading-none"
                  >
                    {post.author.name}
                  </Link>

                  {/* Follow/Following Button */}
                  {user && user._id !== post.author._id && (
                    <button
                      onClick={() => handleFollowToggle(post.author._id)}
                      className={`ml-3 text-[10px] font-bold px-2.5 py-0.5 rounded-full transition border ${
                        followedWriters.includes(post.author._id)
                          ? 'text-gray-400 border-gray-200 dark:border-gray-800 hover:text-red-500 hover:border-red-200 hover:bg-red-50/5'
                          : 'text-emerald-600 hover:text-emerald-700 border-emerald-100 dark:border-emerald-900/60 bg-emerald-500/5 hover:bg-emerald-500/10'
                      }`}
                    >
                      {followedWriters.includes(post.author._id) ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
                
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 font-medium flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>Published {formatDate(post.createdAt)}</span>
                </p>
              </div>
            </div>

            {/* Engagement Controls & Author Actions */}
            <div className="flex items-center justify-between sm:justify-end space-x-6 border-t sm:border-t-0 border-gray-50 dark:border-gray-900 pt-3 sm:pt-0">
              
              {/* Engagement metrics */}
              <div className="flex items-center space-x-5">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-1.5 text-xs font-semibold transition-colors duration-200 ${
                    isLiked
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400'
                  }`}
                  aria-label={isLiked ? "Unlike post" : "Like post"}
                >
                  <Heart className={`h-5 w-5 hover:scale-110 transition-transform ${isLiked ? 'fill-current' : ''}`} />
                  <span>{post.likesCount || 0}</span>
                </button>

                <a
                  href="#comments"
                  className="flex items-center space-x-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <MessageCircle className="h-5 w-5 hover:scale-110 transition-transform" />
                  <span>{post.commentsCount || 0}</span>
                </a>

                <button
                  onClick={handleSave}
                  className={`text-xs font-semibold transition-colors duration-200 ${
                    isSaved
                      ? 'text-yellow-600 dark:text-yellow-500'
                      : 'text-gray-400 dark:text-gray-500 hover:text-yellow-650'
                  }`}
                  aria-label={isSaved ? "Unsave post" : "Save post"}
                >
                  <Bookmark className={`h-5 w-5 hover:scale-110 transition-transform ${isSaved ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Author triggers (Edit/Delete) */}
              {user && user._id === post.author._id && (
                <div className="flex items-center space-x-2 border-l border-gray-100 dark:border-gray-800 pl-4 py-1">
                  <button
                    onClick={() => navigate(`/edit-post/${id}`)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-850 transition"
                    aria-label="Edit post"
                  >
                    <Edit className="h-4.5 w-4.5" />
                  </button>
                  <button
                    onClick={() => openDeleteModal('post')}
                    className="p-1.5 text-red-500 hover:text-red-600 rounded-lg hover:bg-red-500/5 dark:hover:bg-red-500/10 transition"
                    aria-label="Delete post"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* ================= INSET ROUNDED FEATURED COVER IMAGE ================= */}
          {post.image && (
            <div className="w-full h-80 sm:h-96 md:h-[450px] overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-850 shadow-md">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          )}

          {/* ================= HIGH-READABILITY PROSE BODY CONTENT ================= */}
          <div className="max-w-2xl mx-auto py-4 select-text">
            <div
              className="post-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* ================= TAGS FOOTER LIST ================= */}
          {post.tags && post.tags.length > 0 && (
            <div className="max-w-2xl mx-auto flex flex-wrap gap-2 pt-4 pb-6">
              {post.tags.map((tag, index) => (
                <Link
                  key={index}
                  to={`/dashboard`}
                  className="px-3 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-150 dark:border-gray-800 text-xs font-semibold text-gray-600 dark:text-gray-450 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* ================= CURATED COMMENTS SECTION ================= */}
          <div id="comments" className="max-w-2xl mx-auto border border-gray-100 dark:border-gray-800/80 bg-gray-50/20 dark:bg-gray-900/15 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
              Responses ({post.commentsCount || 0})
            </h2>

            {/* Comment Addition Input Form */}
            {user ? (
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <div className="flex items-start space-x-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-9 w-9 rounded-full object-cover border border-gray-250/70 dark:border-gray-800 flex-shrink-0"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-gray-900 dark:bg-gray-800 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="What are your thoughts?"
                      rows={3}
                      className="w-full px-4 py-3 text-sm bg-white dark:bg-gray-850/40 text-gray-900 dark:text-white placeholder-gray-400 border border-gray-200 dark:border-gray-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-350 dark:focus:ring-gray-700 resize-none transition"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={submittingComment || !commentText.trim()}
                        className="flex items-center space-x-1.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-850 dark:hover:bg-white text-white dark:text-gray-950 px-4 py-2 rounded-full font-bold text-xs shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingComment ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Posting...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5" />
                            <span>Respond</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            ) : (
              <div className="bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800/80 rounded-xl p-5 mb-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Please log in to add a response to this story.
                </p>
                <Link
                  to="/login"
                  className="inline-block bg-gray-900 dark:bg-gray-100 hover:bg-gray-850 dark:hover:bg-white text-white dark:text-gray-950 px-5 py-2 rounded-full font-bold text-xs transition"
                >
                  Log in
                </Link>
              </div>
            )}

            {/* List of responses */}
            <div className="space-y-5 pt-2">
              {comments.length === 0 ? (
                <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-6 font-medium">
                  Be the first to share your thoughts on this article!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="flex items-start space-x-3 animate-fadeIn">
                    <Link to={`/profile/${comment.author._id}`} className="flex-shrink-0 group">
                      {comment.author.avatar ? (
                        <img
                          src={comment.author.avatar}
                          alt={comment.author.name}
                          className="h-8.5 w-8.5 rounded-full object-cover border border-gray-200 dark:border-gray-800 group-hover:scale-102 transition"
                        />
                      ) : (
                        <div className="h-8.5 w-8.5 rounded-full bg-gray-900 dark:bg-gray-800 flex items-center justify-center text-white font-bold text-[10px] flex-shrink-0 group-hover:scale-102 transition">
                          {comment.author.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <div className="bg-white dark:bg-gray-900/50 border border-gray-100 dark:border-gray-850/80 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-1">
                          <Link
                            to={`/profile/${comment.author._id}`}
                            className="text-xs font-bold text-gray-800 dark:text-gray-250 hover:underline truncate"
                          >
                            {comment.author.name}
                          </Link>
                          <span className="text-[10px] text-gray-450 dark:text-gray-500 font-medium">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-650 dark:text-gray-300 leading-relaxed font-sans mt-1">
                          {comment.content}
                        </p>
                      </div>
                      
                      {user &&
                        (user._id === comment.author._id ||
                          user.role === 'admin') && (
                          <button
                            onClick={() => openDeleteModal('comment', comment._id)}
                            className="mt-1.5 ml-2 text-[10px] font-bold text-red-500 hover:text-red-650 transition"
                          >
                            Delete Response
                          </button>
                        )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </article>
      </main>

      {/* ================= CONTRAST-SAFE MODALS ================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 px-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 shadow-2xl rounded-2xl max-w-md w-full p-6 relative">
            <button
              onClick={closeDeleteModal}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition"
              aria-label="Close modal"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2.5">
                  Delete {deleteType === 'post' ? 'Post' : 'Response'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
                  {deleteType === 'post'
                    ? 'Are you sure you want to delete this story? This action is permanent, and all associated responses will be deleted immediately.'
                    : 'Are you sure you want to remove this response? This action is permanent and cannot be undone.'}
                </p>
                
                <div className="flex space-x-3.5">
                  <button
                    onClick={closeDeleteModal}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-750 rounded-full text-xs font-bold text-gray-650 dark:text-gray-350 hover:bg-gray-50 dark:hover:bg-gray-850 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition disabled:opacity-50 flex items-center justify-center space-x-2 shadow-sm"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Removing...</span>
                      </>
                    ) : (
                      <span>Confirm Delete</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PostDetail;