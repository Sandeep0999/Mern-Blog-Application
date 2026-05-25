import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const PostCard = ({ post, onLike, onSave, isLiked, isSaved }) => {
  const formatDate = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  return (
    <article className="py-6 border-b border-gray-100 dark:border-gray-800/80 transition-all duration-300 hover:bg-gray-50/40 dark:hover:bg-gray-900/10 px-2 sm:px-4 rounded-xl group">
      <div className="flex items-start justify-between gap-4 md:gap-6">
        
        {/* Left Side: Post content */}
        <div className="flex-1 min-w-0">
          
          {/* Author metadata header */}
          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
            <Link
              to={`/profile/${post.author._id}`}
              className="flex items-center space-x-2 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
            >
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="h-6 w-6 rounded-full object-cover border border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-gray-900 dark:bg-gray-700 flex items-center justify-center text-white font-semibold text-[10px]">
                  {post.author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {post.author.name}
              </span>
            </Link>
            <span>•</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>

          {/* Title & Subtitle */}
          <Link to={`/post/${post._id}`} className="block">
            <h2 className="text-base sm:text-lg md:text-xl font-bold font-sans text-gray-900 dark:text-white leading-snug tracking-tight hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 line-clamp-2">
              {post.title}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-sans leading-relaxed line-clamp-2 mt-1.5 font-light">
              {post.subtitle}
            </p>
          </Link>

          {/* Tags & Meta details */}
          <div className="flex items-center justify-between mt-4 pt-1 flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              {/* Primary tag */}
              {post.tags && post.tags.length > 0 && (
                <span className="px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-[11px] font-medium rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                  {post.tags[0]}
                </span>
              )}
              
              {/* Liked count */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onLike && onLike(post._id);
                }}
                className={`flex items-center space-x-1 text-xs transition-colors duration-200 ${
                  isLiked 
                    ? 'text-red-500 hover:text-red-600' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400'
                }`}
              >
                <Heart className={`h-4.5 w-4.5 transition-transform duration-200 hover:scale-110 ${isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">{post.likesCount || 0}</span>
              </button>

              {/* Comments count */}
              <Link
                to={`/post/${post._id}#comments`}
                className="flex items-center space-x-1 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
              >
                <MessageCircle className="h-4.5 w-4.5 transition-transform duration-200 hover:scale-110" />
                <span className="font-medium">{post.commentsCount || 0}</span>
              </Link>
            </div>

            {/* Save bookmark */}
            <button
              onClick={(e) => {
                e.preventDefault();
                onSave && onSave(post._id);
              }}
              className={`text-xs transition-colors duration-200 ${
                isSaved 
                  ? 'text-yellow-600 dark:text-yellow-500' 
                  : 'text-gray-400 dark:text-gray-500 hover:text-yellow-600 dark:hover:text-yellow-500'
              }`}
              aria-label={isSaved ? "Unsave post" : "Save post"}
            >
              <Bookmark className={`h-4.5 w-4.5 transition-transform duration-200 hover:scale-110 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>

        </div>

        {/* Right Side: Small, high-quality preview thumbnail */}
        {post.image && (
          <Link
            to={`/post/${post._id}`}
            className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-24 overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800/80 flex-shrink-0 relative group"
          >
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover img-zoom-hover"
              loading="lazy"
            />
          </Link>
        )}

      </div>
    </article>
  );
};

export default PostCard;