import mongoose from 'mongoose';

/* ══════════════════════════════════════════════════════
   AUDIT LOG MODEL — Immutable admin action history
   Every moderation action is permanently recorded here.
   ══════════════════════════════════════════════════════ */

const AUDIT_ACTIONS = [
  // Report actions
  'reviewed_report',
  'dismissed_report',
  'resolved_report',
  // User moderation
  'warned_user',
  'issued_strike',
  'suspended_user',
  'banned_user',
  'shadow_banned_user',
  'activated_user',
  'reset_user_strikes',
  'deleted_user',
  'changed_user_role',
  // Post moderation
  'deleted_post',
  'unpublished_post',
  'restored_post',
  'featured_post',
  'unfeatured_post',
  'flagged_post',
  'cleared_post_flag',
  // System
  'system_auto_flag',
];

const auditLogSchema = new mongoose.Schema(
  {
    // ── Who did it ────────────────────────────────────────
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    adminName: {
      type: String, // denormalized for display even if admin is later deleted
      required: true,
    },
    adminRole: {
      type: String,
      required: true,
    },

    // ── What was done ─────────────────────────────────────
    action: {
      type: String,
      enum: AUDIT_ACTIONS,
      required: true,
      index: true,
    },

    // ── What was affected ─────────────────────────────────
    targetType: {
      type: String,
      enum: ['user', 'post', 'comment', 'report'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    targetName: {
      type: String, // denormalized label for display
    },

    // ── Details / Metadata ────────────────────────────────
    details: {
      type: mongoose.Schema.Types.Mixed, // freeform — notes, before/after state etc.
    },
    notes: {
      type: String,
      maxlength: [1000, 'Notes cannot exceed 1000 characters'],
    },

    // ── Security ──────────────────────────────────────────
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
    // Audit logs are immutable — no updates allowed
  }
);

// ── Indexes for admin log viewer ──────────────────────────
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

// ── Prevent accidental mutations ──────────────────────────
auditLogSchema.pre('save', function (next) {
  if (!this.isNew) {
    return next(new Error('Audit logs are immutable and cannot be modified.'));
  }
  next();
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export { AUDIT_ACTIONS };
export default AuditLog;
