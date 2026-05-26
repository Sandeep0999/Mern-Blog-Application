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
    <article
      className="
        group relative
        px-4 sm:px-5 py-5
        border-b border-gray-100 dark:border-white/[0.05]
        hover:bg-gray-50 dark:hover:bg-[#161820]
        rounded-xl
        transition-all duration-200 ease-out
      "
    >
      <div className="flex items-start justify-between gap-4 md:gap-6">

        {/* ── Left: Content ── */}
        <div className="flex-1 min-w-0">

          {/* Author row */}
          <div className="flex items-center space-x-2 mb-2.5">
            <Link
              to={`/profile/${post.author._id}`}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity duration-150"
            >
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="h-6 w-6 rounded-full object-cover border border-gray-200 dark:border-white/10 flex-shrink-0"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-gray-800 dark:bg-[#1c1f2b] flex items-center justify-center text-white font-semibold text-[10px] flex-shrink-0">
                  {post.author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-semibold text-gray-700 dark:text-[#c8d0e0]">
                {post.author.name}
              </span>
            </Link>
            <span className="text-gray-300 dark:text-white/20 text-xs">·</span>
            <span className="text-xs text-gray-400 dark:text-[#555d74]">
              {formatDate(post.createdAt)}
            </span>
          </div>

          {/* Title & Subtitle */}
          <Link to={`/post/${post._id}`} className="block group/title">
            <h2
              className="
                text-base sm:text-lg font-bold
                text-gray-900 dark:text-[#f0f2f8]
                leading-snug tracking-tight
                group-hover/title:text-gray-600 dark:group-hover/title:text-white
                transition-colors duration-200
                line-clamp-2 mb-1.5
              "
            >
              {post.title}
            </h2>
            {post.subtitle && (
              <p
                className="
                  text-sm text-gray-500 dark:text-[#8891a8]
                  leading-relaxed line-clamp-2
                  font-light
                "
              >
                {post.subtitle}
              </p>
            )}
          </Link>

          {/* Footer: tags + interactions */}
          <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
            <div className="flex items-center space-x-3">

              {/* Tag pill */}
              {post.tags && post.tags.length > 0 && (
                <span
                  className="
                    px-2.5 py-0.5
                    bg-gray-100 dark:bg-[#1c1f2b]
                    text-gray-600 dark:text-[#8891a8]
                    text-[10px] font-semibold rounded-full
                    border border-gray-200/70 dark:border-white/[0.06]
                    hover:bg-gray-200 dark:hover:bg-[#252836]
                    transition-colors duration-150 cursor-default
                  "
                >
                  {post.tags[0]}
                </span>
              )}

              {/* Like button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onLike && onLike(post._id);
                }}
                className={`
                  flex items-center space-x-1.5 text-xs font-medium
                  transition-colors duration-200 group/like
                  ${isLiked
                    ? 'text-red-500 dark:text-red-400'
                    : 'text-gray-400 dark:text-[#555d74] hover:text-red-500 dark:hover:text-red-400'
                  }
                `}
              >
                <Heart
                  className={`
                    h-4 w-4
                    group-hover/like:scale-110 transition-transform duration-150
                    ${isLiked ? 'fill-current' : ''}
                  `}
                />
                <span>{post.likesCount || 0}</span>
              </button>

              {/* Comment count */}
              <Link
                to={`/post/${post._id}#comments`}
                className="
                  flex items-center space-x-1.5 text-xs font-medium
                  text-gray-400 dark:text-[#555d74]
                  hover:text-gray-700 dark:hover:text-[#8891a8]
                  transition-colors duration-200 group/comment
                "
              >
                <MessageCircle className="h-4 w-4 group-hover/comment:scale-110 transition-transform duration-150" />
                <span>{post.commentsCount || 0}</span>
              </Link>
            </div>

            {/* Bookmark button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                onSave && onSave(post._id);
              }}
              aria-label={isSaved ? 'Unsave post' : 'Save post'}
              className={`
                transition-all duration-200 group/save
                ${isSaved
                  ? 'text-amber-500 dark:text-amber-400'
                  : 'text-gray-300 dark:text-[#555d74] hover:text-amber-500 dark:hover:text-amber-400'
                }
              `}
            >
              <Bookmark
                className={`
                  h-4 w-4
                  group-hover/save:scale-110 transition-transform duration-150
                  ${isSaved ? 'fill-current' : ''}
                `}
              />
            </button>
          </div>
        </div>

        {/* ── Right: Thumbnail ── */}
        {post.image && (
          <Link
            to={`/post/${post._id}`}
            className="
              w-20 h-20 sm:w-28 sm:h-28 md:w-32 md:h-24
              overflow-hidden rounded-xl
              bg-gray-100 dark:bg-[#1c1f2b]
              border border-gray-100 dark:border-white/[0.05]
              flex-shrink-0
            "
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