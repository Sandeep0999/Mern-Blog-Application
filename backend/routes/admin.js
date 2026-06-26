import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  getUserDetail,
  updateUserStatus,
  issueWarning,
  changeUserRole,
  resetStrikes,
  deleteUser,
  getAllPosts,
  updatePostStatus,
  featurePost,
  adminDeletePost,
  getAuditLogs,
  getAnalytics,
} from '../controllers/adminController.js';
import { protect, admin, moderator, contentReviewer, staff } from '../middleware/auth.js';

const router = express.Router();

// ── All admin routes require authentication ────────────────
router.use(protect);

// ══════════════════════════════════════════════════════════
// DASHBOARD — Staff access (any elevated role)
// ══════════════════════════════════════════════════════════
router.get('/stats', staff, getDashboardStats);
router.get('/analytics', staff, getAnalytics);

// ══════════════════════════════════════════════════════════
// USER MANAGEMENT
// ══════════════════════════════════════════════════════════
router.get('/users', staff, getAllUsers);
router.get('/users/:id', staff, getUserDetail);

// Moderator can warn & update status; admin can change roles
router.patch('/users/:id/status', moderator, updateUserStatus);
router.post('/users/:id/warn', moderator, issueWarning);
router.patch('/users/:id/role', admin, changeUserRole);
router.patch('/users/:id/reset-strikes', moderator, resetStrikes);
router.delete('/users/:id', admin, deleteUser);

// ══════════════════════════════════════════════════════════
// CONTENT / POST MANAGEMENT
// ══════════════════════════════════════════════════════════
router.get('/posts', contentReviewer, getAllPosts);
router.patch('/posts/:id/status', contentReviewer, updatePostStatus);
router.patch('/posts/:id/feature', admin, featurePost);
router.delete('/posts/:id', moderator, adminDeletePost);

// ══════════════════════════════════════════════════════════
// AUDIT LOGS
// ══════════════════════════════════════════════════════════
router.get('/audit-logs', staff, getAuditLogs);

export default router;