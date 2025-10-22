import express from 'express';
import {
  getUserProfile,
  updateProfile,
  savePost,
  getSavedPosts,
  getMyPosts,
} from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/profile').put(protect, updateProfile);
router.route('/profile/:id').get(getUserProfile);
router.route('/save/:postId').put(protect, savePost);
router.route('/saved').get(protect, getSavedPosts);
router.route('/my-posts').get(protect, getMyPosts);

export default router;