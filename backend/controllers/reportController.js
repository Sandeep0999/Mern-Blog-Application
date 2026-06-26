import Report, { REPORT_REASONS } from '../models/Report.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

// Auto-flag threshold — how many unique reports trigger an auto-flag
const AUTO_FLAG_THRESHOLD = 3;

// Risk score weights by reason severity
const REASON_RISK_WEIGHT = {
  spam: 20,
  harassment_or_hate: 80,
  misinformation: 60,
  nsfw_adult_content: 70,
  violence: 85,
  copyright_violation: 50,
  scam_or_fraud: 90,
  fake_information: 55,
  plagiarism: 45,
  offensive_content: 65,
  low_quality_ai_spam: 30,
  other: 25,
};

/* ══════════════════════════════════════════════════════
   SUBMIT REPORT
   POST /api/reports
   Private — authenticated users only
   ══════════════════════════════════════════════════════ */
export const submitReport = async (req, res, next) => {
  try {
    const { targetPostId, reason, customMessage } = req.body;

    // Validate reason
    if (!REPORT_REASONS.includes(reason)) {
      return res.status(400).json({ message: 'Invalid report reason.' });
    }

    if (!targetPostId) {
      return res.status(400).json({ message: 'Target post is required.' });
    }

    // Validate post exists
    const post = await Post.findById(targetPostId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    // Prevent self-reporting
    if (post.author.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot report your own post.' });
    }

    // Duplicate prevention — one report per user per post
    const existingReport = await Report.findOne({
      reporterUserId: req.user._id,
      targetPostId,
    });
    if (existingReport) {
      return res.status(409).json({
        message: 'You have already reported this post.',
        alreadyReported: true,
      });
    }

    // Validate custom message for 'other' reason
    if (reason === 'other' && !customMessage?.trim()) {
      return res.status(400).json({
        message: 'Please provide a description for "Other" reports.',
      });
    }

    // Compute risk score
    const riskScore = Math.min(REASON_RISK_WEIGHT[reason] || 25, 100);

    // Create the report
    const report = await Report.create({
      reporterUserId: req.user._id,
      targetPostId,
      targetUserId: post.author,
      reason,
      customMessage: reason === 'other' ? customMessage?.trim() : undefined,
      riskScore,
    });

    // Atomically increment post report count
    const updatedPost = await Post.findByIdAndUpdate(
      targetPostId,
      { $inc: { reportCount: 1 } },
      { new: true }
    );

    // Auto-flag post if threshold reached
    if (updatedPost.reportCount >= AUTO_FLAG_THRESHOLD && !updatedPost.autoFlagged) {
      await Post.findByIdAndUpdate(targetPostId, {
        $set: { autoFlagged: true, status: 'flagged' },
      });

      // Log the auto-flag
      await AuditLog.create({
        adminId: req.user._id,
        adminName: 'System',
        adminRole: 'system',
        action: 'system_auto_flag',
        targetType: 'post',
        targetId: targetPostId,
        targetName: updatedPost.title,
        details: {
          reportCount: updatedPost.reportCount,
          triggeredBy: req.user._id,
        },
      }).catch(() => {}); // Non-critical
    }

    // Also increment the author's reportCount
    await User.findByIdAndUpdate(post.author, { $inc: { reportCount: 1 } });

    res.status(201).json({
      message: 'Report submitted. Thanks for helping keep DailyPen safe.',
      reportId: report._id,
    });
  } catch (error) {
    // Duplicate key error from MongoDB (race condition backup)
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'You have already reported this post.',
        alreadyReported: true,
      });
    }
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   GET REPORT QUEUE (Admin/Moderator)
   GET /api/reports
   Admin/Moderator only
   ══════════════════════════════════════════════════════ */
export const getReports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const { status, reason, autoFlagged, sortBy } = req.query;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (reason) filter.reason = reason;
    if (autoFlagged !== undefined) filter.autoFlagged = autoFlagged === 'true';

    // Sort
    let sortOption = { createdAt: -1 }; // default: newest first
    if (sortBy === 'risk') sortOption = { riskScore: -1, createdAt: -1 };
    else if (sortBy === 'oldest') sortOption = { createdAt: 1 };

    const [reports, total] = await Promise.all([
      Report.find(filter)
        .populate('reporterUserId', 'name email avatar')
        .populate('targetPostId', 'title image author reportCount autoFlagged status')
        .populate('targetUserId', 'name email avatar strikes status')
        .populate('reviewedBy', 'name')
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Report.countDocuments(filter),
    ]);

    // Pending count for badge
    const pendingCount = await Report.countDocuments({ status: 'pending' });

    res.json({
      reports,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      total,
      pendingCount,
    });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   GET SINGLE REPORT DETAIL
   GET /api/reports/:id
   Admin/Moderator only
   ══════════════════════════════════════════════════════ */
export const getReportById = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reporterUserId', 'name email avatar createdAt')
      .populate({
        path: 'targetPostId',
        select: 'title subtitle image author reportCount autoFlagged status createdAt',
        populate: { path: 'author', select: 'name email avatar' },
      })
      .populate('targetUserId', 'name email avatar strikes warnings status reportCount')
      .populate('reviewedBy', 'name role');

    if (!report) {
      return res.status(404).json({ message: 'Report not found.' });
    }

    // Get all reports against same post for context
    const relatedReports = report.targetPostId
      ? await Report.find({
          targetPostId: report.targetPostId._id,
          _id: { $ne: report._id },
        })
          .select('reason status createdAt reporterUserId')
          .populate('reporterUserId', 'name')
          .sort({ createdAt: -1 })
          .limit(10)
      : [];

    res.json({ report, relatedReports });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   SET REPORT TO UNDER REVIEW
   PATCH /api/reports/:id/review
   Admin/Moderator only
   ══════════════════════════════════════════════════════ */
export const markUnderReview = async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found.' });
    if (report.status !== 'pending') {
      return res.status(400).json({ message: 'Report is not in pending status.' });
    }

    report.status = 'under_review';
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    await AuditLog.create({
      adminId: req.user._id,
      adminName: req.user.name,
      adminRole: req.user.role,
      action: 'reviewed_report',
      targetType: 'report',
      targetId: report._id,
      ipAddress: req.ip,
    });

    res.json({ message: 'Report marked as under review.', report });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   RESOLVE REPORT
   POST /api/reports/:id/resolve
   Admin/Moderator only
   ══════════════════════════════════════════════════════ */
export const resolveReport = async (req, res, next) => {
  try {
    const { action, resolutionNotes, status } = req.body;

    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "resolved" or "dismissed".' });
    }

    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    report.status = status;
    report.action = action || 'none';
    report.resolutionNotes = resolutionNotes;
    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();
    await report.save();

    // Execute moderation action if applicable
    if (action === 'removed_post' && report.targetPostId) {
      await Post.findByIdAndUpdate(report.targetPostId, { status: 'removed' });
    } else if (action === 'unpublished_post' && report.targetPostId) {
      await Post.findByIdAndUpdate(report.targetPostId, { status: 'unpublished' });
    } else if (action === 'marked_safe' && report.targetPostId) {
      await Post.findByIdAndUpdate(report.targetPostId, {
        $set: { autoFlagged: false, status: 'published' },
      });
    }

    await AuditLog.create({
      adminId: req.user._id,
      adminName: req.user.name,
      adminRole: req.user.role,
      action: status === 'resolved' ? 'resolved_report' : 'dismissed_report',
      targetType: 'report',
      targetId: report._id,
      details: { action, resolutionNotes },
      notes: resolutionNotes,
      ipAddress: req.ip,
    });

    res.json({ message: `Report ${status} successfully.`, report });
  } catch (error) {
    next(error);
  }
};

/* ══════════════════════════════════════════════════════
   CHECK IF USER HAS REPORTED A POST
   GET /api/reports/check/:postId
   Private
   ══════════════════════════════════════════════════════ */
export const checkUserReport = async (req, res, next) => {
  try {
    const existing = await Report.findOne({
      reporterUserId: req.user._id,
      targetPostId: req.params.postId,
    }).select('_id status');

    res.json({ hasReported: !!existing, report: existing || null });
  } catch (error) {
    next(error);
  }
};
