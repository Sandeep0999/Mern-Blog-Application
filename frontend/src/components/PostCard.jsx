import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, Clock, MoreHorizontal, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ReportModal from './ReportModal';

/* ─────────────────────────────────────────
   Estimate read time from plain-text content
   ~200 words per minute
   ───────────────────────────────────────── */
const getReadTime = (content = '') => {
  const text = content.replace(/<[^>]+>/g, '').trim();
  const words = text.split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
};

/* ─────────────────────────────────────────
   Initials avatar fallback
   ───────────────────────────────────────── */
const AVATAR_COLORS = [
  'linear-gradient(135deg, #e8a838, #f07b38)',
  'linear-gradient(135deg, #7c6ef5, #5b4de8)',
  'linear-gradient(135deg, #34d399, #059669)',
  'linear-gradient(135deg, #60a5fa, #2563eb)',
  'linear-gradient(135deg, #f472b6, #db2777)',
];

const getAvatarGradient = (name = '') => {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

/* ═══════════════════════════════════════════════════════
   POST CARD — Editorial Medium-style reading list item

   KEY DESIGN DECISIONS:
   - Hover via CSS class (dp-post-card) — no JS padding mutations
   - Separator via box-shadow (inset 0 -1px 0) — zero layout shift
   - Title hover color done via CSS (.dp-post-card:hover .dp-post-title)
   - Thumbnail zoom via CSS (.dp-post-card:hover .dp-post-thumb img)
   ═══════════════════════════════════════════════════════ */
const PostCard = ({ post, onLike, onSave, isLiked, isSaved }) => {
  const { user } = useAuth();
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const isAuthor = user && post.author && user._id === post.author._id;
  const canReport = user && !isAuthor;

  const formatDate = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  const readTime = getReadTime(post.content || post.subtitle || '');

  const handleLike = (e) => {
    e.preventDefault();
    if (onLike) {
      setLikeAnimating(true);
      onLike(post._id);
      setTimeout(() => setLikeAnimating(false), 450);
    }
  };

  return (
    <>
    <article className="dp-post-card group">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px' }}>

        {/* ── Left: Content ── */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Author row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <Link
              to={`/profile/${post.author._id}`}
              style={{ display: 'flex', alignItems: 'center', gap: '7px', textDecoration: 'none' }}
            >
              {post.author.avatar ? (
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: '1.5px solid var(--dp-s3)',
                    transition: 'border-color 0.2s ease',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '10px',
                    background: getAvatarGradient(post.author.name),
                  }}
                >
                  {post.author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--dp-body)',
                  transition: 'color 0.15s ease',
                }}
              >
                {post.author.name}
              </span>
            </Link>

            {/* Separator */}
            <span style={{ color: 'var(--dp-muted)', fontSize: '10px' }}>·</span>

            {/* Timestamp */}
            <span style={{ fontSize: '0.75rem', color: 'var(--dp-muted)', fontWeight: 400 }}>
              {formatDate(post.createdAt)}
            </span>

            {/* Read time */}
            {(post.content || post.subtitle) && (
              <>
                <span style={{ color: 'var(--dp-muted)', fontSize: '10px' }}>·</span>
                <span className="dp-read-time">
                  <Clock style={{ width: '11px', height: '11px' }} />
                  {readTime}
                </span>
              </>
            )}
          </div>

          {/* Title & Subtitle */}
          <Link to={`/post/${post._id}`} style={{ display: 'block', textDecoration: 'none' }}>
            <h2 className="dp-post-title">
              {post.title}
            </h2>

            {post.subtitle && (
              <p className="dp-post-excerpt">
                {post.subtitle}
              </p>
            )}
          </Link>

          {/* Footer row: tags + engagement */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>

              {/* Tags (up to 2) */}
              {post.tags && post.tags.slice(0, 2).map((tag, i) => (
                <span
                  key={i}
                  className="tag-pill"
                  style={{ fontSize: '0.67rem' }}
                >
                  #{tag}
                </span>
              ))}

              {/* Divider */}
              {post.tags && post.tags.length > 0 && (
                <span style={{ color: 'var(--dp-muted)', fontSize: '10px' }}>·</span>
              )}

              {/* Like button */}
              <button
                id={`like-btn-${post._id}`}
                onClick={handleLike}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px 4px',
                  borderRadius: '6px',
                  color: isLiked ? '#ef4444' : 'var(--dp-muted)',
                  transition: 'color 0.18s ease',
                }}
                onMouseEnter={e => { if (!isLiked) e.currentTarget.style.color = '#ef4444'; }}
                onMouseLeave={e => { if (!isLiked) e.currentTarget.style.color = 'var(--dp-muted)'; }}
              >
                <Heart
                  style={{
                    width: '14px',
                    height: '14px',
                    fill: isLiked ? '#ef4444' : 'none',
                    strokeWidth: 2,
                    transition: 'transform 0.15s ease',
                  }}
                  className={likeAnimating ? 'animate-heartbeat' : ''}
                />
                <span>{post.likesCount || 0}</span>
              </button>

              {/* Comment count */}
              <Link
                to={`/post/${post._id}#comments`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--dp-muted)',
                  textDecoration: 'none',
                  padding: '2px 4px',
                  borderRadius: '6px',
                  transition: 'color 0.18s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--dp-body)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--dp-muted)'}
              >
                <MessageCircle style={{ width: '14px', height: '14px', strokeWidth: 2 }} />
                <span>{post.commentsCount || 0}</span>
              </Link>
            </div>

            {/* Bookmark */}
            <button
              id={`save-btn-${post._id}`}
              onClick={(e) => { e.preventDefault(); onSave && onSave(post._id); }}
              aria-label={isSaved ? 'Remove bookmark' : 'Save post'}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                color: isSaved ? 'var(--dp-accent)' : 'var(--dp-muted)',
                transition: 'color 0.18s ease, transform 0.18s ease',
              }}
              onMouseEnter={e => {
                if (!isSaved) e.currentTarget.style.color = 'var(--dp-accent)';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={e => {
                if (!isSaved) e.currentTarget.style.color = 'var(--dp-muted)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Bookmark
                style={{
                  width: '16px',
                  height: '16px',
                  fill: isSaved ? 'var(--dp-accent)' : 'none',
                  strokeWidth: 2,
                }}
              />
            </button>

            {/* Three-dot report menu — only for logged-in non-authors */}
            {canReport && (
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button
                  id={`more-btn-${post._id}`}
                  onClick={(e) => { e.preventDefault(); setMenuOpen(prev => !prev); }}
                  aria-label="More options"
                  aria-haspopup="true"
                  aria-expanded={menuOpen}
                  style={{
                    display: 'flex', alignItems: 'center',
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '4px', borderRadius: '6px',
                    color: 'var(--dp-muted)',
                    transition: 'color 0.18s ease',
                    opacity: menuOpen ? 1 : 0.6,
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.opacity = '0.6'; }}
                >
                  <MoreHorizontal style={{ width: '15px', height: '15px' }} />
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      right: 0,
                      marginBottom: '6px',
                      background: 'var(--dp-bg)',
                      border: '1px solid var(--dp-border)',
                      borderRadius: '10px',
                      boxShadow: 'var(--dp-shadow-hover)',
                      minWidth: '140px',
                      zIndex: 50,
                      overflow: 'hidden',
                      animation: 'reportFadeIn 0.15s ease both',
                    }}
                  >
                    <button
                      onClick={(e) => { e.preventDefault(); setMenuOpen(false); setReportOpen(true); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        width: '100%', padding: '10px 14px',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '0.78rem', fontWeight: 600,
                        color: '#ef4444',
                        transition: 'background 0.15s ease',
                        textAlign: 'left',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Flag style={{ width: '13px', height: '13px' }} />
                      Report Post
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Thumbnail ── */}
        {post.image && (
          <Link
            to={`/post/${post._id}`}
            className="dp-post-thumb"
          >
            <img
              src={post.image}
              alt={post.title}
              loading="lazy"
            />
          </Link>
        )}
      </div>
    </article>

    {/* Report Modal */}
    <ReportModal
      postId={post._id}
      postTitle={post.title}
      isOpen={reportOpen}
      onClose={() => setReportOpen(false)}
    />
  </>
  );
};

export default PostCard;