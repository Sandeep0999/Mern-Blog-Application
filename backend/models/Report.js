import mongoose from 'mongoose';

/* ══════════════════════════════════════════════════════
   REPORT MODEL — Production-grade report system
   ══════════════════════════════════════════════════════ */

const REPORT_REASONS = [
  'spam',
  'harassment_or_hate',
  'misinformation',
  'nsfw_adult_content',
  'violence',
  'copyright_violation',
  'scam_or_fraud',
  'fake_information',
  'plagiarism',
  'offensive_content',
  'low_quality_ai_spam',
  'other',
];

const REPORT_STATUSES = ['pending', 'under_review', 'resolved', 'dismissed'];

const reportSchema = new mongoose.Schema(
  {
    // ── Reporter ────────────────────────────────────────
    reporterUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // ── Target ──────────────────────────────────────────
    targetPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      index: true,
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // ── Report Details ───────────────────────────────────
    reason: {
      type: String,
      enum: REPORT_REASONS,
      required: [true, 'A report reason is required'],
    },
    customMessage: {
      type: String,
      maxlength: [500, 'Custom message cannot exceed 500 characters'],
      trim: true,
    },

    // ── Status & Workflow ────────────────────────────────
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: 'pending',
      index: true,
    },

    // ── Auto-moderation Flags ────────────────────────────
    autoFlagged: {
      type: Boolean,
      default: false,
    },
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // ── Admin Review ─────────────────────────────────────
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
    resolutionNotes: {
      type: String,
      maxlength: [1000, 'Resolution notes cannot exceed 1000 characters'],
      trim: true,
    },
    action: {
      type: String,
      enum: [
        'none',
        'dismissed',
        'warned_user',
        'removed_post',
        'unpublished_post',
        'suspended_user',
        'banned_user',
        'shadow_banned_user',
        'marked_safe',
      ],
      default: 'none',
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes ──────────────────────────────────────────────
// Prevent duplicate reports from the same user on the same post
reportSchema.index(
  { reporterUserId: 1, targetPostId: 1 },
  { unique: true, sparse: true }
);
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ targetPostId: 1, status: 1 });
reportSchema.index({ targetUserId: 1 });
reportSchema.index({ autoFlagged: 1, status: 1 });

// ── Virtuals ─────────────────────────────────────────────
reportSchema.virtual('isResolved').get(function () {
  return this.status === 'resolved' || this.status === 'dismissed';
});

const Report = mongoose.model('Report', reportSchema);

export { REPORT_REASONS, REPORT_STATUSES };
export default Report;
