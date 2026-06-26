import express from 'express';
import {
  submitReport,
  getReports,
  getReportById,
  markUnderReview,
  resolveReport,
  checkUserReport,
} from '../controllers/reportController.js';
import { protect, moderator } from '../middleware/auth.js';

const router = express.Router();

// ── User Routes (authenticated) ────────────────────────────
router.post('/', protect, submitReport);
router.get('/check/:postId', protect, checkUserReport);

// ── Admin / Moderator Routes ───────────────────────────────
router.get('/', protect, moderator, getReports);
router.get('/:id', protect, moderator, getReportById);
router.patch('/:id/review', protect, moderator, markUnderReview);
router.post('/:id/resolve', protect, moderator, resolveReport);

export default router;
