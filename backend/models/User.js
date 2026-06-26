import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      // Not required — Google-only accounts have no password
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },

    // ── Google OAuth ──────────────────────────────────────────
    googleId: {
      type: String,
      default: null,
      index: { sparse: true }, // allows null but indexes real values uniquely
    },
    authProvider: {
      type: String,
      enum: ['local', 'google'],
      default: 'local',
    },
    // ─────────────────────────────────────────────────────────

    otpHash: {
      type: String,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'content_reviewer', 'support_admin', 'admin'],
      default: 'user',
    },

    // ── Moderation / Account Status ─────────────────────────
    status: {
      type: String,
      enum: ['active', 'shadow_banned', 'suspended', 'banned'],
      default: 'active',
      index: true,
    },
    isShadowBanned: {
      type: Boolean,
      default: false,
      index: true,
    },
    suspendedUntil: {
      type: Date,
      default: null,
    },

    // ── Strike & Warning System ──────────────────────────────
    strikes: {
      type: Number,
      default: 0,
      min: 0,
    },
    warnings: [
      {
        message: { type: String, required: true },
        issuedAt: { type: Date, default: Date.now },
        issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],

    // ── Report Tracking ──────────────────────────────────────
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    bio: {
      type: String,
      maxlength: [200, 'Bio cannot be more than 200 characters'],
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance and scalability
userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });

// Hash password before saving (skip if no password — Google accounts)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;