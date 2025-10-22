import express from 'express';
import {
  getAllUsers,
  deleteUser,
  getDashboardStats,
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(admin);

router.route('/users').get(getAllUsers);
router.route('/users/:id').delete(deleteUser);
router.route('/stats').get(getDashboardStats);

export default router;