import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const PostCard = ({ post, onLike, onSave, isLiked, isSaved }) => {
  const formatDate = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300">
      <Link to={`/post/${post._id}`}>
        <div className="aspect-video w-full overflow-hidden bg-gray-100">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>

      <div className="p-5">
        {/* Author Info */}
        <Link
          to={`/profile/${post.author._id}`}
          className="flex items-center space-x-3 mb-4"
        >
          {post.author.avatar ? (
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-semibold">
              {post.author.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900">{post.author.name}</p>
            <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
          </div>
        </Link>

        {/* Post Title and Subtitle */}
        <Link to={`/post/${post._id}`}>
          <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-gray-700 transition-colors line-clamp-2">
            {post.title}
          </h2>
          <p className="text-gray-600 mb-4 line-clamp-2">{post.subtitle}</p>
        </Link>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => onLike && onLike(post._id)}
              className={`flex items-center space-x-1 ${
                isLiked ? 'text-red-500' : 'text-gray-500'
              } hover:text-red-500 transition-colors`}
            >
              <Heart
                className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`}
              />
              <span className="text-sm font-medium">{post.likesCount || 0}</span>
            </button>

            <Link
              to={`/post/${post._id}#comments`}
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{post.commentsCount || 0}</span>
            </Link>
          </div>

          <button
            onClick={() => onSave && onSave(post._id)}
            className={`${
              isSaved ? 'text-blue-500' : 'text-gray-500'
            } hover:text-blue-500 transition-colors`}
          >
            <Bookmark className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostCard;