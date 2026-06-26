import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import API from '../api/axios';
import { toast } from 'react-toastify';
import { formatDistanceToNow, format } from 'date-fns';
import {
  LayoutDashboard, AlertTriangle, Users, FileText, BarChart2,
  ClipboardList, Shield, Bell, Search, ChevronDown, ChevronLeft,
  ChevronRight, Loader2, X, Check, Ban, EyeOff, Clock,
  TrendingUp, Flag, Star, Trash2, Eye, RefreshCw, Sun, Moon,
  AlertCircle, CheckCircle2, ExternalLink, MoreVertical, User,
  MessageSquare, Activity, ArrowUp, ArrowDown, Minus,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════ */
const fmtDate = (d) => {
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }); }
  catch { return '—'; }
};

const fmtFull = (d) => {
  try { return format(new Date(d), 'MMM d, yyyy HH:mm'); }
  catch { return '—'; }
};

const REASON_LABELS = {
  spam: 'Spam',
  harassment_or_hate: 'Harassment / Hate',
  misinformation: 'Misinformation',
  nsfw_adult_content: 'NSFW',
  violence: 'Violence',
  copyright_violation: 'Copyright',
  scam_or_fraud: 'Scam / Fraud',
  fake_information: 'Fake Info',
  plagiarism: 'Plagiarism',
  offensive_content: 'Offensive',
  low_quality_ai_spam: 'AI Spam',
  other: 'Other',
};

const getRiskBadge = (score) => {
  if (score >= 80) return <span className="badge-critical">Critical</span>;
  if (score >= 60) return <span className="badge-high">High</span>;
  if (score >= 40) return <span className="badge-medium">Medium</span>;
  return <span className="badge-low">Low</span>;
};

const getStatusBadge = (status) => {
  const map = {
    active: 'badge-active', banned: 'badge-banned',
    suspended: 'badge-suspended', shadow_banned: 'badge-shadow',
    pending: 'badge-pending', resolved: 'badge-resolved',
    dismissed: 'badge-dismissed', under_review: 'badge-pending',
    published: 'badge-resolved', removed: 'badge-banned',
    unpublished: 'badge-suspended', flagged: 'badge-high',
  };
  const label = {
    shadow_banned: 'Shadow Ban', under_review: 'In Review',
  };
  return (
    <span className={map[status] || 'badge-low'}>
      {label[status] || status?.replace(/_/g, ' ')}
    </span>
  );
};

const AvatarFallback = ({ name = '', size = 32 }) => {
  const colors = ['#e8a838','#7c6ef5','#34d399','#60a5fa','#f472b6'];
  const bg = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 700, fontSize: size * 0.38,
    }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   CONFIRM MODAL
   ══════════════════════════════════════════════════════ */
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, danger = true, loading }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
    }}>
      <div style={{
        background: 'var(--dp-bg)', border: '1px solid var(--dp-border)',
        borderRadius: '16px', maxWidth: '400px', width: '100%', padding: '24px',
        boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
            background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle style={{ width: '18px', height: '18px', color: danger ? '#ef4444' : '#3b82f6' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--dp-heading)', marginBottom: '6px' }}>{title}</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--dp-subtle)', lineHeight: 1.6 }}>{message}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} disabled={loading}
            style={{ flex: 1, padding: '9px', borderRadius: '9px', border: '1.5px solid var(--dp-border)', background: 'transparent', color: 'var(--dp-subtle)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{
              flex: 1, padding: '9px', borderRadius: '9px', border: 'none',
              background: danger ? '#ef4444' : '#3b82f6', color: '#fff',
              fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            }}>
            {loading ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 0.9s linear infinite' }} /> : null}
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   DASHBOARD SECTION
   ══════════════════════════════════════════════════════ */
const DashboardSection = ({ stats, loading }) => {
  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}>
      <Loader2 style={{ width: '32px', height: '32px', color: 'var(--dp-accent)', animation: 'spin 0.9s linear infinite' }} />
    </div>
  );

  const statCards = [
    { label: 'Total Users',     value: stats.totalUsers,     icon: Users,          color: '#60a5fa', bg: 'rgba(96,165,250,0.1)'  },
    { label: 'Total Posts',     value: stats.totalPosts,     icon: FileText,        color: '#34d399', bg: 'rgba(52,211,153,0.1)'  },
    { label: 'Total Comments',  value: stats.totalComments,  icon: MessageSquare,   color: '#a78bfa', bg: 'rgba(167,139,250,0.1)' },
    { label: 'Pending Reports', value: stats.pendingReports, icon: AlertTriangle,   color: '#f97316', bg: 'rgba(249,115,22,0.1)',  alert: stats.pendingReports > 0 },
    { label: 'Flagged Posts',   value: stats.flaggedPosts,   icon: Flag,            color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   alert: stats.flaggedPosts > 0   },
    { label: 'Flagged Users',   value: stats.flaggedUsers,   icon: Ban,             color: '#eab308', bg: 'rgba(234,179,8,0.1)',   alert: stats.flaggedUsers > 0   },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px' }}>
        {statCards.map(({ label, value, icon: Icon, color, bg, alert }) => (
          <div key={label} className="dp-stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon style={{ width: '18px', height: '18px', color }} />
              </div>
              {alert && value > 0 && (
                <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: '999px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                  Needs Review
                </span>
              )}
            </div>
            <p style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--dp-heading)', letterSpacing: '-0.04em', lineHeight: 1 }}>{value ?? 0}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--dp-muted)', fontWeight: 500, marginTop: '4px' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Recent Pending Reports */}
      {stats.recentReports?.length > 0 && (
        <div className="dp-admin-card">
          <div className="dp-admin-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle style={{ width: '16px', height: '16px', color: '#f97316' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dp-heading)' }}>Pending Reports</span>
              <span style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: '999px', background: 'rgba(249,115,22,0.1)', color: '#f97316', fontWeight: 700 }}>
                {stats.pendingReports}
              </span>
            </div>
          </div>
          {stats.recentReports.map(r => (
            <div key={r._id} className="dp-report-item">
              {r.reporterUserId?.avatar ? (
                <img src={r.reporterUserId.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <AvatarFallback name={r.reporterUserId?.name || '?'} size={32} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--dp-heading)', marginBottom: '2px' }}>
                  {r.reporterUserId?.name || 'Unknown'} reported a post
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--dp-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.targetPostId?.title || 'Deleted post'} · {REASON_LABELS[r.reason] || r.reason}
                </p>
              </div>
              <span style={{ fontSize: '0.68rem', color: 'var(--dp-muted)', flexShrink: 0 }}>{fmtDate(r.createdAt)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recent Users */}
      {stats.recentUsers?.length > 0 && (
        <div className="dp-admin-card">
          <div className="dp-admin-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users style={{ width: '16px', height: '16px', color: '#60a5fa' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dp-heading)' }}>Recent Signups</span>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="dp-admin-table">
              <thead><tr>
                <th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th>
              </tr></thead>
              <tbody>
                {stats.recentUsers.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {u.avatar ? <img src={u.avatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} /> : <AvatarFallback name={u.name} size={28} />}
                        <span style={{ fontWeight: 600, color: 'var(--dp-heading)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--dp-muted)' }}>{u.email}</td>
                    <td><span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: u.role === 'admin' ? 'rgba(232,168,56,0.12)' : 'var(--dp-s2)', color: u.role === 'admin' ? 'var(--dp-accent)' : 'var(--dp-subtle)' }}>{u.role}</span></td>
                    <td>{getStatusBadge(u.status || 'active')}</td>
                    <td style={{ color: 'var(--dp-muted)' }}>{fmtDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   REPORTS SECTION
   ══════════════════════════════════════════════════════ */
const ReportsSection = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ status: '', reason: '', sortBy: 'createdAt' });
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolveForm, setResolveForm] = useState({ status: '', action: 'none', notes: '' });
  const [resolving, setResolving] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, ...filters });
      const { data } = await API.get(`/reports?${params}`);
      setReports(data.reports);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch { toast.error('Failed to load reports'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const handleMarkReview = async (reportId) => {
    try {
      await API.patch(`/reports/${reportId}/review`);
      toast.success('Marked as under review');
      fetchReports();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const handleResolve = async () => {
    if (!resolveForm.status) { toast.error('Select a resolution status'); return; }
    setResolving(true);
    try {
      await API.post(`/reports/${selectedReport._id}/resolve`, resolveForm);
      toast.success('Report resolved');
      setSelectedReport(null);
      fetchReports();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setResolving(false); }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: '100%', minHeight: 0 }}>
      {/* Report List */}
      <div style={{ flex: selectedReport ? '0 0 55%' : '1', minWidth: 0 }}>
        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <select value={filters.status} onChange={e => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
            style={{ padding: '7px 12px', borderRadius: '9px', border: '1px solid var(--dp-border)', background: 'var(--dp-s1)', color: 'var(--dp-body)', fontSize: '0.78rem', outline: 'none' }}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
          <select value={filters.reason} onChange={e => { setFilters(p => ({ ...p, reason: e.target.value })); setPage(1); }}
            style={{ padding: '7px 12px', borderRadius: '9px', border: '1px solid var(--dp-border)', background: 'var(--dp-s1)', color: 'var(--dp-body)', fontSize: '0.78rem', outline: 'none' }}>
            <option value="">All Reasons</option>
            {Object.entries(REASON_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={filters.sortBy} onChange={e => { setFilters(p => ({ ...p, sortBy: e.target.value })); setPage(1); }}
            style={{ padding: '7px 12px', borderRadius: '9px', border: '1px solid var(--dp-border)', background: 'var(--dp-s1)', color: 'var(--dp-body)', fontSize: '0.78rem', outline: 'none' }}>
            <option value="createdAt">Newest First</option>
            <option value="risk">Highest Risk</option>
            <option value="oldest">Oldest First</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--dp-muted)', fontWeight: 500 }}>{total} reports</span>
        </div>

        <div className="dp-admin-card">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <Loader2 style={{ width: '24px', height: '24px', color: 'var(--dp-accent)', animation: 'spin 0.9s linear infinite' }} />
            </div>
          ) : reports.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center' }}>
              <CheckCircle2 style={{ width: '36px', height: '36px', color: '#34d399', margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--dp-heading)', marginBottom: '4px' }}>No reports found</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--dp-muted)' }}>Clear filters or check back later</p>
            </div>
          ) : (
            reports.map(r => (
              <div key={r._id} className="dp-report-item" onClick={() => setSelectedReport(r)}
                style={{ background: selectedReport?._id === r._id ? 'var(--dp-s1)' : undefined }}>
                <div style={{ flexShrink: 0, marginTop: '2px' }}>
                  {r.autoFlagged && <Flag style={{ width: '14px', height: '14px', color: '#ef4444' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    {getStatusBadge(r.status)}
                    {getRiskBadge(r.riskScore)}
                    <span className="badge-low" style={{ textTransform: 'none', letterSpacing: 0 }}>
                      {REASON_LABELS[r.reason] || r.reason}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--dp-heading)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.targetPostId?.title || 'Post deleted'}
                  </p>
                  <p style={{ fontSize: '0.68rem', color: 'var(--dp-muted)' }}>
                    by {r.reporterUserId?.name || '?'} · {fmtDate(r.createdAt)}
                  </p>
                </div>
                {r.status === 'pending' && (
                  <button onClick={(e) => { e.stopPropagation(); handleMarkReview(r._id); }}
                    className="dp-admin-action-btn neutral" style={{ flexShrink: 0 }}>
                    Review
                  </button>
                )}
              </div>
            ))
          )}
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="dp-admin-pagination">
              <button className="dp-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft style={{ width: '14px', height: '14px' }} />
              </button>
              <span style={{ fontSize: '0.75rem', color: 'var(--dp-muted)', padding: '0 8px' }}>{page} / {totalPages}</span>
              <button className="dp-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Report Detail Panel */}
      {selectedReport && (
        <div style={{ flex: '0 0 42%', minWidth: 0 }}>
          <div className="dp-admin-card" style={{ position: 'sticky', top: '20px' }}>
            <div className="dp-admin-card-header">
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--dp-heading)' }}>Report Detail</span>
              <button onClick={() => setSelectedReport(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dp-muted)' }}>
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Status & Reason */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {getStatusBadge(selectedReport.status)}
                {getRiskBadge(selectedReport.riskScore)}
                <span className="badge-low" style={{ textTransform: 'none', letterSpacing: 0 }}>
                  {REASON_LABELS[selectedReport.reason]}
                </span>
              </div>

              {/* Reported Post */}
              {selectedReport.targetPostId && (
                <div style={{ padding: '12px', background: 'var(--dp-s1)', borderRadius: '10px', border: '1px solid var(--dp-border)' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--dp-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Reported Post</p>
                  <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--dp-heading)', marginBottom: '4px' }}>
                    {selectedReport.targetPostId.title}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {getStatusBadge(selectedReport.targetPostId.status || 'published')}
                    <span style={{ fontSize: '0.68rem', color: 'var(--dp-muted)' }}>
                      {selectedReport.targetPostId.reportCount || 0} total reports
                    </span>
                    <Link to={`/post/${selectedReport.targetPostId._id}`} target="_blank"
                      style={{ fontSize: '0.68rem', color: 'var(--dp-accent)', display: 'flex', alignItems: 'center', gap: '3px', textDecoration: 'none' }}>
                      <ExternalLink style={{ width: '10px', height: '10px' }} /> View
                    </Link>
                  </div>
                </div>
              )}

              {/* Reporter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: 'var(--dp-s1)', borderRadius: '10px' }}>
                {selectedReport.reporterUserId?.avatar ? (
                  <img src={selectedReport.reporterUserId.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : <AvatarFallback name={selectedReport.reporterUserId?.name || '?'} size={32} />}
                <div>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--dp-heading)' }}>{selectedReport.reporterUserId?.name}</p>
                  <p style={{ fontSize: '0.65rem', color: 'var(--dp-muted)' }}>Reported {fmtDate(selectedReport.createdAt)}</p>
                </div>
              </div>

              {/* Custom message */}
              {selectedReport.customMessage && (
                <div style={{ padding: '10px 14px', background: 'rgba(232,168,56,0.08)', borderRadius: '9px', border: '1px solid var(--dp-accent-border)' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--dp-accent)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Message</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--dp-body)', lineHeight: 1.6 }}>{selectedReport.customMessage}</p>
                </div>
              )}

              {/* Resolution form */}
              {(selectedReport.status === 'pending' || selectedReport.status === 'under_review') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--dp-border)' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--dp-heading)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Take Action</p>
                  <select value={resolveForm.action} onChange={e => setResolveForm(p => ({ ...p, action: e.target.value }))}
                    style={{ padding: '8px 12px', borderRadius: '9px', border: '1px solid var(--dp-border)', background: 'var(--dp-s1)', color: 'var(--dp-body)', fontSize: '0.78rem', outline: 'none' }}>
                    <option value="none">No Action</option>
                    <option value="marked_safe">Mark Post as Safe</option>
                    <option value="unpublished_post">Unpublish Post</option>
                    <option value="removed_post">Remove Post</option>
                    <option value="warned_user">Warn Author</option>
                    <option value="suspended_user">Suspend Author</option>
                    <option value="banned_user">Ban Author</option>
                    <option value="shadow_banned_user">Shadow Ban Author</option>
                  </select>
                  <textarea value={resolveForm.notes} onChange={e => setResolveForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Resolution notes (optional)..."
                    rows={2}
                    style={{ padding: '8px 12px', borderRadius: '9px', border: '1px solid var(--dp-border)', background: 'var(--dp-s1)', color: 'var(--dp-body)', fontSize: '0.78rem', outline: 'none', resize: 'none', fontFamily: 'var(--dp-font-ui)' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setResolveForm(p => ({ ...p, status: 'dismissed' })); setTimeout(handleResolve, 0); }}
                      disabled={resolving} className="dp-admin-action-btn neutral" style={{ flex: 1, justifyContent: 'center' }}>
                      Dismiss
                    </button>
                    <button onClick={() => { setResolveForm(p => ({ ...p, status: 'resolved' })); setTimeout(handleResolve, 0); }}
                      disabled={resolving} className="dp-admin-action-btn success" style={{ flex: 1, justifyContent: 'center' }}>
                      {resolving ? <Loader2 style={{ width: '12px', height: '12px', animation: 'spin 0.9s linear infinite' }} /> : <Check style={{ width: '12px', height: '12px' }} />}
                      Resolve
                    </button>
                  </div>
                </div>
              )}

              {/* Already resolved */}
              {selectedReport.status === 'resolved' || selectedReport.status === 'dismissed' ? (
                <div style={{ padding: '10px', background: 'var(--dp-s1)', borderRadius: '10px' }}>
                  <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--dp-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>Resolution</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--dp-body)' }}>Action: {selectedReport.action?.replace(/_/g, ' ') || 'None'}</p>
                  {selectedReport.resolutionNotes && <p style={{ fontSize: '0.72rem', color: 'var(--dp-muted)', marginTop: '4px' }}>{selectedReport.resolutionNotes}</p>}
                  <p style={{ fontSize: '0.65rem', color: 'var(--dp-muted)', marginTop: '6px' }}>Resolved by {selectedReport.reviewedBy?.name || '?'} · {fmtDate(selectedReport.reviewedAt)}</p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   USERS SECTION
   ══════════════════════════════════════════════════════ */
const UsersSection = () => {
  const { user: adminUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ status: '', role: '', sortBy: 'createdAt' });
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, search, ...filters });
      const { data } = await API.get(`/admin/users?${params}`);
      setUsers(data.users);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [page, search, filters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleStatusChange = async (userId, status) => {
    setActionLoading(true);
    try {
      await API.patch(`/admin/users/${userId}/status`, { status });
      toast.success(`User ${status.replace(/_/g, ' ')}`);
      fetchUsers();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); setConfirm(null); }
  };

  const handleDelete = async (userId) => {
    setActionLoading(true);
    try {
      await API.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); setConfirm(null); }
  };

  return (
    <div>
      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--dp-muted)' }} />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search users..."
            className="dp-admin-search"
            style={{ paddingLeft: '32px', width: '100%' }}
          />
        </div>
        <select value={filters.status} onChange={e => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          style={{ padding: '7px 12px', borderRadius: '9px', border: '1px solid var(--dp-border)', background: 'var(--dp-s1)', color: 'var(--dp-body)', fontSize: '0.78rem', outline: 'none' }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
          <option value="shadow_banned">Shadow Banned</option>
        </select>
        <select value={filters.sortBy} onChange={e => { setFilters(p => ({ ...p, sortBy: e.target.value })); setPage(1); }}
          style={{ padding: '7px 12px', borderRadius: '9px', border: '1px solid var(--dp-border)', background: 'var(--dp-s1)', color: 'var(--dp-body)', fontSize: '0.78rem', outline: 'none' }}>
          <option value="createdAt">Newest</option>
          <option value="strikes">Most Strikes</option>
          <option value="reports">Most Reported</option>
          <option value="name">Name</option>
        </select>
        <span style={{ fontSize: '0.72rem', color: 'var(--dp-muted)', fontWeight: 500, flexShrink: 0 }}>{total} users</span>
      </div>

      <div className="dp-admin-card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 style={{ width: '24px', height: '24px', color: 'var(--dp-accent)', animation: 'spin 0.9s linear infinite' }} />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="dp-admin-table">
              <thead><tr>
                <th>User</th><th>Status</th><th>Role</th><th>Strikes</th><th>Reports</th><th>Joined</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {u.avatar ? <img src={u.avatar} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} /> : <AvatarFallback name={u.name} size={32} />}
                        <div>
                          <p style={{ fontWeight: 600, color: 'var(--dp-heading)', fontSize: '0.82rem' }}>{u.name}</p>
                          <p style={{ fontSize: '0.68rem', color: 'var(--dp-muted)' }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>{getStatusBadge(u.status || 'active')}</td>
                    <td><span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: '999px', background: u.role === 'admin' ? 'rgba(232,168,56,0.12)' : 'var(--dp-s2)', color: u.role === 'admin' ? 'var(--dp-accent)' : 'var(--dp-subtle)' }}>{u.role}</span></td>
                    <td style={{ fontWeight: 600, color: u.strikes > 0 ? '#ef4444' : 'var(--dp-muted)' }}>{u.strikes || 0}</td>
                    <td style={{ fontWeight: 600, color: u.reportCount > 0 ? '#f97316' : 'var(--dp-muted)' }}>{u.reportCount || 0}</td>
                    <td style={{ color: 'var(--dp-muted)' }}>{fmtDate(u.createdAt)}</td>
                    <td>
                      {u.role !== 'admin' && u._id !== adminUser?._id && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {u.status !== 'banned' && (
                            <button onClick={() => setConfirm({ type: 'ban', user: u })} className="dp-admin-action-btn danger">Ban</button>
                          )}
                          {u.status === 'banned' && (
                            <button onClick={() => handleStatusChange(u._id, 'active')} className="dp-admin-action-btn success">Restore</button>
                          )}
                          {u.status !== 'shadow_banned' && u.status !== 'banned' && (
                            <button onClick={() => handleStatusChange(u._id, 'shadow_banned')} className="dp-admin-action-btn warning">Shadow Ban</button>
                          )}
                          <button onClick={() => setConfirm({ type: 'delete', user: u })} className="dp-admin-action-btn danger">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="dp-admin-pagination">
            <button className="dp-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft style={{ width: '14px', height: '14px' }} />
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--dp-muted)', padding: '0 8px' }}>{page} / {totalPages}</span>
            <button className="dp-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!confirm}
        title={confirm?.type === 'ban' ? `Ban ${confirm?.user?.name}?` : `Delete ${confirm?.user?.name}?`}
        message={confirm?.type === 'ban' ? 'This user will be permanently banned from DailyPen.' : 'This will permanently delete the user and all their content.'}
        onConfirm={() => confirm?.type === 'ban' ? handleStatusChange(confirm.user._id, 'banned') : handleDelete(confirm.user._id)}
        onCancel={() => setConfirm(null)}
        loading={actionLoading}
      />
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   CONTENT SECTION
   ══════════════════════════════════════════════════════ */
const ContentSection = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ status: '', autoFlagged: '', sortBy: 'createdAt' });
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, ...filters });
      const { data } = await API.get(`/admin/posts?${params}`);
      setPosts(data.posts);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch { toast.error('Failed to load posts'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleStatusChange = async (postId, status) => {
    setActionLoading(true);
    try {
      await API.patch(`/admin/posts/${postId}/status`, { status });
      toast.success(`Post ${status}`);
      fetchPosts();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); setConfirm(null); }
  };

  const handleDelete = async (postId) => {
    setActionLoading(true);
    try {
      await API.delete(`/admin/posts/${postId}`);
      toast.success('Post deleted');
      fetchPosts();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setActionLoading(false); setConfirm(null); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
        <select value={filters.status} onChange={e => { setFilters(p => ({ ...p, status: e.target.value })); setPage(1); }}
          style={{ padding: '7px 12px', borderRadius: '9px', border: '1px solid var(--dp-border)', background: 'var(--dp-s1)', color: 'var(--dp-body)', fontSize: '0.78rem', outline: 'none' }}>
          <option value="">All Posts</option>
          <option value="published">Published</option>
          <option value="flagged">Flagged</option>
          <option value="unpublished">Unpublished</option>
          <option value="removed">Removed</option>
        </select>
        <select value={filters.autoFlagged} onChange={e => { setFilters(p => ({ ...p, autoFlagged: e.target.value })); setPage(1); }}
          style={{ padding: '7px 12px', borderRadius: '9px', border: '1px solid var(--dp-border)', background: 'var(--dp-s1)', color: 'var(--dp-body)', fontSize: '0.78rem', outline: 'none' }}>
          <option value="">All</option>
          <option value="true">Auto-Flagged Only</option>
        </select>
        <select value={filters.sortBy} onChange={e => { setFilters(p => ({ ...p, sortBy: e.target.value })); setPage(1); }}
          style={{ padding: '7px 12px', borderRadius: '9px', border: '1px solid var(--dp-border)', background: 'var(--dp-s1)', color: 'var(--dp-body)', fontSize: '0.78rem', outline: 'none' }}>
          <option value="createdAt">Newest</option>
          <option value="reports">Most Reported</option>
          <option value="likes">Most Liked</option>
        </select>
        <span style={{ fontSize: '0.72rem', color: 'var(--dp-muted)', fontWeight: 500, flexShrink: 0 }}>{total} posts</span>
      </div>

      <div className="dp-admin-card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 style={{ width: '24px', height: '24px', color: 'var(--dp-accent)', animation: 'spin 0.9s linear infinite' }} />
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="dp-admin-table">
              <thead><tr>
                <th>Post</th><th>Author</th><th>Status</th><th>Reports</th><th>Likes</th><th>Published</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {posts.map(p => (
                  <tr key={p._id}>
                    <td style={{ maxWidth: '220px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {p.image && <img src={p.image} alt="" style={{ width: '40px', height: '30px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />}
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 600, color: 'var(--dp-heading)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</p>
                          {p.autoFlagged && <span style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 700 }}>⚑ Auto-flagged</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      {p.author && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {p.author.avatar ? <img src={p.author.avatar} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} /> : <AvatarFallback name={p.author.name} size={20} />}
                          <span style={{ fontSize: '0.75rem', color: 'var(--dp-body)' }}>{p.author.name}</span>
                        </div>
                      )}
                    </td>
                    <td>{getStatusBadge(p.status)}</td>
                    <td style={{ fontWeight: 600, color: p.reportCount > 0 ? '#f97316' : 'var(--dp-muted)' }}>{p.reportCount || 0}</td>
                    <td style={{ color: 'var(--dp-muted)' }}>{p.likesCount || 0}</td>
                    <td style={{ color: 'var(--dp-muted)', whiteSpace: 'nowrap' }}>{fmtDate(p.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <Link to={`/post/${p._id}`} target="_blank">
                          <button className="dp-admin-action-btn neutral"><Eye style={{ width: '11px', height: '11px' }} /></button>
                        </Link>
                        {p.status !== 'removed' && (
                          <button onClick={() => handleStatusChange(p._id, p.status === 'published' ? 'unpublished' : 'published')} className="dp-admin-action-btn warning">
                            {p.status === 'published' ? 'Unpublish' : 'Publish'}
                          </button>
                        )}
                        <button onClick={() => setConfirm({ post: p })} className="dp-admin-action-btn danger">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="dp-admin-pagination">
            <button className="dp-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft style={{ width: '14px', height: '14px' }} />
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--dp-muted)', padding: '0 8px' }}>{page} / {totalPages}</span>
            <button className="dp-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!confirm}
        title={`Delete "${confirm?.post?.title?.slice(0, 40)}..."?`}
        message="This will permanently delete the post and all its comments."
        onConfirm={() => handleDelete(confirm.post._id)}
        onCancel={() => setConfirm(null)}
        loading={actionLoading}
      />
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   AUDIT LOG SECTION
   ══════════════════════════════════════════════════════ */
const AuditLogSection = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/admin/audit-logs?page=${page}&limit=25`);
      setLogs(data.logs);
      setTotalPages(data.totalPages);
    } catch { toast.error('Failed to load audit logs'); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const actionColors = {
    banned_user: '#ef4444', deleted_user: '#ef4444', deleted_post: '#ef4444',
    warned_user: '#f97316', suspended_user: '#f97316', shadow_banned_user: '#6b7280',
    resolved_report: '#10b981', dismissed_report: '#6b7280', activated_user: '#10b981',
    restored_post: '#10b981', featured_post: 'var(--dp-accent)',
  };

  return (
    <div>
      <div className="dp-admin-card">
        <div className="dp-admin-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList style={{ width: '16px', height: '16px', color: 'var(--dp-accent)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dp-heading)' }}>Audit Log</span>
          </div>
          <button onClick={fetchLogs} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dp-muted)' }}>
            <RefreshCw style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 style={{ width: '24px', height: '24px', color: 'var(--dp-accent)', animation: 'spin 0.9s linear infinite' }} />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--dp-muted)' }}>No audit log entries yet.</p>
          </div>
        ) : (
          logs.map(log => (
            <div key={log._id} className="dp-audit-entry">
              <div className="dp-audit-dot" style={{ background: actionColors[log.action] || 'var(--dp-accent)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  {log.adminId?.avatar ? (
                    <img src={log.adminId.avatar} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : <AvatarFallback name={log.adminName || '?'} size={20} />}
                  <span style={{ fontWeight: 600, color: 'var(--dp-heading)', fontSize: '0.78rem' }}>{log.adminName}</span>
                  <span style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: '999px', background: 'var(--dp-s2)', color: 'var(--dp-muted)', fontWeight: 600 }}>{log.adminRole}</span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--dp-body)', lineHeight: 1.5 }}>
                  <span style={{ fontWeight: 700, color: actionColors[log.action] || 'var(--dp-accent)' }}>
                    {log.action?.replace(/_/g, ' ')}
                  </span>
                  {log.targetName && <> on <span style={{ fontWeight: 600, color: 'var(--dp-heading)' }}>{log.targetName}</span></>}
                </p>
                {log.notes && <p style={{ fontSize: '0.68rem', color: 'var(--dp-muted)', marginTop: '2px' }}>Note: {log.notes}</p>}
              </div>
              <span style={{ fontSize: '0.65rem', color: 'var(--dp-muted)', flexShrink: 0 }}>{fmtDate(log.createdAt)}</span>
            </div>
          ))
        )}
        {totalPages > 1 && (
          <div className="dp-admin-pagination">
            <button className="dp-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft style={{ width: '14px', height: '14px' }} />
            </button>
            <span style={{ fontSize: '0.75rem', color: 'var(--dp-muted)', padding: '0 8px' }}>{page} / {totalPages}</span>
            <button className="dp-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              <ChevronRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   ANALYTICS SECTION
   ══════════════════════════════════════════════════════ */
const AnalyticsSection = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/analytics')
      .then(({ data }) => setAnalytics(data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '60px' }}><Loader2 style={{ width: '32px', height: '32px', color: 'var(--dp-accent)', animation: 'spin 0.9s linear infinite' }} /></div>;
  if (!analytics) return null;

  const maxVal = (arr) => Math.max(...arr.map(d => d.count), 1);

  const SimpleBar = ({ data, color, label }) => {
    const max = maxVal(data);
    return (
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--dp-heading)', marginBottom: '12px' }}>{label}</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px' }}>
          {data.slice(-14).map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', gap: '4px' }}>
              <div style={{
                width: '100%', borderRadius: '4px 4px 0 0',
                background: color,
                height: `${Math.max(4, (d.count / max) * 80)}px`,
                transition: 'height 0.3s ease',
                opacity: 0.8,
              }} title={`${d._id}: ${d.count}`} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span style={{ fontSize: '0.6rem', color: 'var(--dp-muted)' }}>{data.slice(-14)[0]?._id?.slice(5) || ''}</span>
          <span style={{ fontSize: '0.6rem', color: 'var(--dp-muted)' }}>{data.slice(-1)[0]?._id?.slice(5) || ''}</span>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '14px' }}>
        {[
          { data: analytics.userGrowth, color: '#60a5fa', label: '30-Day User Signups' },
          { data: analytics.postGrowth, color: '#34d399', label: '30-Day Post Activity' },
          { data: analytics.reportTrend, color: '#f97316', label: '30-Day Report Trend' },
        ].map(({ data, color, label }) => (
          <div key={label} className="dp-admin-card" style={{ padding: '20px' }}>
            {data.length > 0 ? <SimpleBar data={data} color={color} label={label} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100px' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--dp-muted)' }}>No data yet</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Top Writers */}
      {analytics.topWriters?.length > 0 && (
        <div className="dp-admin-card">
          <div className="dp-admin-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star style={{ width: '16px', height: '16px', color: 'var(--dp-accent)' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dp-heading)' }}>Top Writers</span>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="dp-admin-table">
              <thead><tr>
                <th>#</th><th>Writer</th><th>Posts</th><th>Total Likes</th>
              </tr></thead>
              <tbody>
                {analytics.topWriters.map((w, i) => (
                  <tr key={w._id}>
                    <td style={{ fontWeight: 800, color: i < 3 ? 'var(--dp-accent)' : 'var(--dp-muted)', fontSize: '1rem' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {w.authorInfo.avatar ? <img src={w.authorInfo.avatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} /> : <AvatarFallback name={w.authorInfo.name} size={28} />}
                        <span style={{ fontWeight: 600, color: 'var(--dp-heading)', fontSize: '0.82rem' }}>{w.authorInfo.name}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--dp-body)' }}>{w.totalPosts}</td>
                    <td style={{ fontWeight: 600, color: 'var(--dp-accent)' }}>{w.totalLikes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports by reason */}
      {analytics.reportsByReason?.length > 0 && (
        <div className="dp-admin-card">
          <div className="dp-admin-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flag style={{ width: '16px', height: '16px', color: '#f97316' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--dp-heading)' }}>Reports by Reason</span>
            </div>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {analytics.reportsByReason.map(r => {
              const max = analytics.reportsByReason[0]?.count || 1;
              return (
                <div key={r._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--dp-body)' }}>{REASON_LABELS[r._id] || r._id}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--dp-heading)' }}>{r.count}</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--dp-s2)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(r.count / max) * 100}%`, background: 'var(--dp-accent)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════
   ADMIN PANEL — MAIN COMPONENT
   ══════════════════════════════════════════════════════ */
const AdminPanel = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch(() => toast.error('Failed to fetch stats'))
      .finally(() => setStatsLoading(false));
  }, []);

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'reports',   icon: AlertTriangle,  label: 'Reports',    badge: stats?.pendingReports },
    { id: 'users',     icon: Users,           label: 'Users' },
    { id: 'content',   icon: FileText,        label: 'Content',    badge: stats?.flaggedPosts },
    { id: 'analytics', icon: BarChart2,       label: 'Analytics' },
    { id: 'audit',     icon: ClipboardList,   label: 'Audit Log' },
  ];

  const sectionTitles = {
    dashboard: 'Dashboard', reports: 'Moderation Queue',
    users: 'User Management', content: 'Content Management',
    analytics: 'Analytics', audit: 'Audit Log',
  };

  return (
    <div className="dp-admin-page">
      {/* ── Sidebar ── */}
      <nav className="dp-admin-sidebar">
        {/* Brand */}
        <div style={{ padding: '20px 14px 16px', borderBottom: '1px solid var(--dp-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--dp-accent), #f07b38)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield style={{ width: '16px', height: '16px', color: '#fff' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--dp-heading)', lineHeight: 1 }}>DailyPen</p>
              <p style={{ fontSize: '0.6rem', color: 'var(--dp-muted)', fontWeight: 500 }}>Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto' }}>
          {navItems.map(({ id, icon: Icon, label, badge }) => (
            <button key={id} onClick={() => setActiveSection(id)}
              className={`dp-admin-nav-item${activeSection === id ? ' active' : ''}`}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <Icon style={{ width: '16px', height: '16px' }} />
                {badge > 0 && (
                  <span style={{
                    position: 'absolute', top: '-5px', right: '-5px',
                    width: '14px', height: '14px', borderRadius: '50%',
                    background: '#ef4444', color: '#fff',
                    fontSize: '0.5rem', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{badge > 99 ? '99+' : badge}</span>
                )}
              </div>
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid var(--dp-border)', flexShrink: 0 }}>
          <button onClick={toggleTheme} className="dp-admin-nav-item" style={{ gap: '10px' }}>
            {theme === 'dark' ? <Sun style={{ width: '16px', height: '16px', color: 'var(--dp-accent)', flexShrink: 0 }} /> : <Moon style={{ width: '16px', height: '16px', flexShrink: 0 }} />}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <Link to="/dashboard" className="dp-admin-nav-item">
            <ChevronLeft style={{ width: '16px', height: '16px', flexShrink: 0 }} />
            <span>Back to Site</span>
          </Link>
        </div>
      </nav>

      {/* ── Main Content ── */}
      <main className="dp-admin-content">
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--dp-heading)', letterSpacing: '-0.03em' }}>
              {sectionTitles[activeSection]}
            </h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--dp-muted)', marginTop: '3px', fontWeight: 500 }}>
              {user?.name} · {user?.role?.replace(/_/g, ' ')}
            </p>
          </div>
          {activeSection === 'dashboard' && (
            <button onClick={() => { setStatsLoading(true); API.get('/admin/stats').then(({ data }) => setStats(data)).finally(() => setStatsLoading(false)); }}
              className="dp-admin-action-btn neutral">
              <RefreshCw style={{ width: '13px', height: '13px' }} />
              Refresh
            </button>
          )}
        </div>

        {/* Section Render */}
        {activeSection === 'dashboard' && <DashboardSection stats={stats || {}} loading={statsLoading} />}
        {activeSection === 'reports'   && <ReportsSection />}
        {activeSection === 'users'     && <UsersSection />}
        {activeSection === 'content'   && <ContentSection />}
        {activeSection === 'analytics' && <AnalyticsSection />}
        {activeSection === 'audit'     && <AuditLogSection />}
      </main>
    </div>
  );
};

export default AdminPanel;