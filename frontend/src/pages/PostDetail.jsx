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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState(null); // 'post' or 'comment'
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPost();
    fetchComments();
    if (user) {
      checkIfSaved();
    }
  }, [id]);

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
      toast.success(isSaved ? 'Post unsaved' : 'Post saved');
    } catch (error) {
      toast.error('Failed to save post');
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
        toast.success('Comment deleted');
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
    return formatDistanceToNow(new Date(date), { addSuffix: true });
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

      <main className="flex-1">
        {/* Featured Image */}
        <div className="w-full h-96 bg-gray-900">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover opacity-90"
          />
        </div>

        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
          {/* Post Header */}
          <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <Link
                to={`/profile/${post.author._id}`}
                className="flex items-center space-x-3"
              >
                {post.author.avatar ? (
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold text-lg">
                    {post.author.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {post.author.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(post.createdAt)}
                  </p>
                </div>
              </Link>

              {user && user._id === post.author._id && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate(`/edit-post/${id}`)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => openDeleteModal('post')}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 mb-4 leading-tight">
              {post.title}
            </h1>

            <p className="text-xl text-gray-600 mb-6 leading-relaxed">
              {post.subtitle}
            </p>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-6">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 ${
                    post.likes?.includes(user?._id)
                      ? 'text-red-500'
                      : 'text-gray-600'
                  } hover:text-red-500 transition-colors`}
                >
                  <Heart
                    className={`h-6 w-6 ${
                      post.likes?.includes(user?._id) ? 'fill-current' : ''
                    }`}
                  />
                  <span className="font-medium">{post.likesCount || 0}</span>
                </button>

                <a
                  href="#comments"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <MessageCircle className="h-6 w-6" />
                  <span className="font-medium">{post.commentsCount || 0}</span>
                </a>
              </div>

              <button
                onClick={handleSave}
                className={`${
                  isSaved ? 'text-blue-500' : 'text-gray-600'
                } hover:text-blue-500 transition-colors`}
              >
                <Bookmark
                  className={`h-6 w-6 ${isSaved ? 'fill-current' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Post Content */}
          <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
            <div
              className="post-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          {/* Comments Section */}
          <div id="comments" className="bg-white rounded-lg shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Comments ({post.commentsCount || 0})
            </h2>

            {/* Comment Form */}
            {user ? (
              <form onSubmit={handleCommentSubmit} className="mb-8">
                <div className="flex items-start space-x-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none"
                    />
                    <button
                      type="submit"
                      disabled={submittingComment || !commentText.trim()}
                      className="mt-3 flex items-center space-x-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="h-4 w-4" />
                      <span>
                        {submittingComment ? 'Posting...' : 'Post Comment'}
                      </span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-center">
                <p className="text-gray-600 mb-4">
                  Please login to comment on this post
                </p>
                <Link
                  to="/login"
                  className="inline-block bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Login
                </Link>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-6">
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment._id} className="flex items-start space-x-3">
                    <Link to={`/profile/${comment.author._id}`}>
                      {comment.author.avatar ? (
                        <img
                          src={comment.author.avatar}
                          alt={comment.author.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {comment.author.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Link
                            to={`/profile/${comment.author._id}`}
                            className="font-semibold text-gray-900 hover:underline"
                          >
                            {comment.author.name}
                          </Link>
                          <span className="text-sm text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                      {user &&
                        (user._id === comment.author._id ||
                          user.role === 'admin') && (
                          <button
                            onClick={() => openDeleteModal('comment', comment._id)}
                            className="mt-2 text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete {deleteType === 'post' ? 'Post' : 'Comment'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {deleteType === 'post'
                    ? 'Are you sure you want to delete this post? This action cannot be undone and all comments will be permanently removed.'
                    : 'Are you sure you want to delete this comment? This action cannot be undone.'}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={closeDeleteModal}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={deleting}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {deleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <span>Delete</span>
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