import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import Report from '../models/Report.js';
import AuditLog from '../models/AuditLog.js';

/* ══════════════════════════════════════════════════════
   HELPER — create audit log entry
   ══════════════════════════════════════════════════════ */
const logAction = async (req, action, targetType, targetId, targetName, details = {}, notes = '') => {
  try {
    await AuditLog.create({
      adminId: req.user._id,
      adminName: req.user.name,
      adminRole: req.user.role,
      action,
      targetType,
      targetId,
      targetName,
      details,
      notes,
      ipAddress: req.ip,
    });
  } catch (err) {
    console.error('[AuditLog Error]', err.message);
  }
};

/* ══════════════════════════════════════════════════════
   DASHBOARD STATS
   GET /api/admin/stats
   ══════════════════════════════════════════════════════ */
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalPosts,
      totalComments,
      totalReports,
      pendingReports,
      flaggedPosts,
      flaggedUsers,
      recentUsers,
      recentPosts,
    ] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Comment.countDocuments(),
      Report.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      Post.countDocuments({ autoFlagged: true, status: 'flagged' }),
      User.countDocuments({ status: { $in: ['shadow_banned', 'suspended', 'banned'] } }),
      User.find().select('-password').sort({ createdAt: -1 }).limit(5),
      Post.find({ status: { $in: ['published', 'flagged'] } })
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(5),
    ]);

    // 7-day trend data (posts and users per day)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [dailyUsers, dailyPosts] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Post.aggregate([
        { $match: { createdAt: { $gte: sevenDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Recent reports
    const recentReports = await Report.find({ status: 'pending' })
      .populate('reporterUserId', 'name avatar')
      .populate('targetPostId', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers,
      totalPosts,
      totalComments,
      totalReports,
      pendingReports,
      flaggedPosts,
      flaggedUsers,
      recentUsers,
      recentPosts,
      recentReports,
      trends: { dailyUsers, dailyPosts },
    });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   GET ALL USERS (paginated + search + filter)
   GET /api/admin/users
   ══════════════════════════════════════════════════════ */
export const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, status, role, sortBy } = req.query;

    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (role) filter.role = role;

    let sortOption = { createdAt: -1 };
    if (sortBy === 'strikes') sortOption = { strikes: -1, createdAt: -1 };
    else if (sortBy === 'reports') sortOption = { reportCount: -1, createdAt: -1 };
    else if (sortBy === 'name') sortOption = { name: 1 };

    const [users, total] = await Promise.all([
      User.find(filter).select('-password -otpHash -otpExpiresAt').sort(sortOption).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      users,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   GET USER DETAIL
   GET /api/admin/users/:id
   ══════════════════════════════════════════════════════ */
export const getUserDetail = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -otpHash -otpExpiresAt')
      .populate('warnings.issuedBy', 'name role');

    if (!user) return res.status(404).json({ message: 'User not found.' });

    const [postCount, reportsMade, reportsReceived, recentPosts] = await Promise.all([
      Post.countDocuments({ author: req.params.id }),
      Report.countDocuments({ reporterUserId: req.params.id }),
      Report.countDocuments({ targetUserId: req.params.id }),
      Post.find({ author: req.params.id }).sort({ createdAt: -1 }).limit(5).select('title status reportCount createdAt'),
    ]);

    res.json({ user, stats: { postCount, reportsMade, reportsReceived }, recentPosts });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   UPDATE USER STATUS (ban, suspend, shadow ban, activate)
   PATCH /api/admin/users/:id/status
   ══════════════════════════════════════════════════════ */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { status, suspendedUntil, reason } = req.body;
    const validStatuses = ['active', 'shadow_banned', 'suspended', 'banned'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Prevent modifying another admin
    if (user.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot modify another admin.' });
    }

    const previousStatus = user.status;
    user.status = status;
    user.isShadowBanned = status === 'shadow_banned';
    if (status === 'suspended' && suspendedUntil) {
      user.suspendedUntil = new Date(suspendedUntil);
    } else if (status !== 'suspended') {
      user.suspendedUntil = null;
    }
    await user.save();

    const actionMap = {
      active: 'activated_user',
      shadow_banned: 'shadow_banned_user',
      suspended: 'suspended_user',
      banned: 'banned_user',
    };

    await logAction(req, actionMap[status], 'user', user._id, user.name,
      { previousStatus, newStatus: status, suspendedUntil, reason }, reason);

    res.json({ message: `User status updated to ${status}.`, user });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   ISSUE WARNING TO USER
   POST /api/admin/users/:id/warn
   ══════════════════════════════════════════════════════ */
export const issueWarning = async (req, res, next) => {
  try {
    const { message, addStrike } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Warning message is required.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.warnings.push({ message: message.trim(), issuedBy: req.user._id });
    if (addStrike) user.strikes += 1;
    await user.save();

    await logAction(req, addStrike ? 'issued_strike' : 'warned_user', 'user', user._id,
      user.name, { message, addStrike }, message);

    res.json({
      message: `Warning issued${addStrike ? ' with strike' : ''}.`,
      strikes: user.strikes,
      warnings: user.warnings,
    });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   CHANGE USER ROLE
   PATCH /api/admin/users/:id/role
   Admin only
   ══════════════════════════════════════════════════════ */
export const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    const validRoles = ['user', 'moderator', 'content_reviewer', 'support_admin', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const previousRole = user.role;
    user.role = role;
    await user.save();

    await logAction(req, 'changed_user_role', 'user', user._id, user.name,
      { previousRole, newRole: role });

    res.json({ message: `Role updated to ${role}.`, user });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   RESET USER STRIKES
   PATCH /api/admin/users/:id/reset-strikes
   ══════════════════════════════════════════════════════ */
export const resetStrikes = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.strikes = 0;
    await user.save();

    await logAction(req, 'reset_user_strikes', 'user', user._id, user.name);
    res.json({ message: 'Strikes reset.', user });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   DELETE USER
   DELETE /api/admin/users/:id
   ══════════════════════════════════════════════════════ */
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    const userPostIds = await Post.find({ author: req.params.id }).distinct('_id');
    await Post.deleteMany({ author: req.params.id });
    await Comment.deleteMany({ author: req.params.id });
    await Report.deleteMany({ reporterUserId: req.params.id });

    await User.updateMany(
      { savedPosts: { $exists: true } },
      { $pull: { savedPosts: { $in: userPostIds } } }
    );
    await User.updateMany({}, { $pull: { followers: req.params.id, following: req.params.id } });

    await logAction(req, 'deleted_user', 'user', user._id, user.name, { email: user.email });
    await user.deleteOne();

    res.json({ message: 'User and associated data removed' });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   GET ALL POSTS (admin view — with filters)
   GET /api/admin/posts
   ══════════════════════════════════════════════════════ */
export const getAllPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, status, autoFlagged, sortBy } = req.query;

    const filter = {};
    if (search) filter.$text = { $search: search };
    if (status) filter.status = status;
    if (autoFlagged !== undefined) filter.autoFlagged = autoFlagged === 'true';

    let sortOption = { createdAt: -1 };
    if (sortBy === 'reports') sortOption = { reportCount: -1, createdAt: -1 };
    else if (sortBy === 'likes') sortOption = { likesCount: -1 };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'name email avatar status')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .select('title status reportCount autoFlagged likesCount commentsCount createdAt author image'),
      Post.countDocuments(filter),
    ]);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   UPDATE POST STATUS
   PATCH /api/admin/posts/:id/status
   ══════════════════════════════════════════════════════ */
export const updatePostStatus = async (req, res, next) => {
  try {
    const { status, moderationNote } = req.body;
    const validStatuses = ['published', 'unpublished', 'removed', 'flagged'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid post status.' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    const previousStatus = post.status;
    post.status = status;
    if (moderationNote) post.moderationNote = moderationNote;
    // Clear auto-flag if publishing or marking as safe
    if (status === 'published') post.autoFlagged = false;
    await post.save();

    const actionMap = {
      removed: 'deleted_post',
      unpublished: 'unpublished_post',
      published: 'restored_post',
      flagged: 'flagged_post',
    };

    await logAction(req, actionMap[status], 'post', post._id, post.title,
      { previousStatus, newStatus: status, moderationNote }, moderationNote);

    res.json({ message: `Post status updated to ${status}.`, post });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   FEATURE / UNFEATURE POST
   PATCH /api/admin/posts/:id/feature
   ══════════════════════════════════════════════════════ */
export const featurePost = async (req, res, next) => {
  try {
    const { featured } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    post.featured = !!featured;
    await post.save();

    await logAction(req, featured ? 'featured_post' : 'unfeatured_post', 'post', post._id, post.title);
    res.json({ message: `Post ${featured ? 'featured' : 'unfeatured'}.`, post });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   ADMIN DELETE POST (force)
   DELETE /api/admin/posts/:id
   ══════════════════════════════════════════════════════ */
export const adminDeletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });

    await Comment.deleteMany({ post: req.params.id });
    await User.updateMany({ savedPosts: req.params.id }, { $pull: { savedPosts: req.params.id } });

    await logAction(req, 'deleted_post', 'post', post._id, post.title);
    await post.deleteOne();

    res.json({ message: 'Post permanently deleted.' });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   GET AUDIT LOGS
   GET /api/admin/audit-logs
   ══════════════════════════════════════════════════════ */
export const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;
    const { adminId, action, targetType } = req.query;

    const filter = {};
    if (adminId) filter.adminId = adminId;
    if (action) filter.action = action;
    if (targetType) filter.targetType = targetType;

    const [logs, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('adminId', 'name avatar role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   ANALYTICS
   GET /api/admin/analytics
   ══════════════════════════════════════════════════════ */
export const getAnalytics = async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      userGrowth,
      postGrowth,
      reportTrend,
      topWriters,
      reportsByReason,
      activeUserCount,
    ] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Post.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, status: 'published' } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Report.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Post.aggregate([
        { $group: { _id: '$author', totalPosts: { $sum: 1 }, totalLikes: { $sum: '$likesCount' } } },
        { $sort: { totalLikes: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'authorInfo' } },
        { $unwind: '$authorInfo' },
        { $project: { totalPosts: 1, totalLikes: 1, 'authorInfo.name': 1, 'authorInfo.avatar': 1 } },
      ]),
      Report.aggregate([
        { $group: { _id: '$reason', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      User.countDocuments({ status: 'active' }),
    ]);

    res.json({
      userGrowth,
      postGrowth,
      reportTrend,
      topWriters,
      reportsByReason,
      activeUserCount,
    });
  } catch (error) {
    next(error);
  }
};