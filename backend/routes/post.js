import express from 'express';
import {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  searchPosts,
  getComments,
  addComment,
  deleteComment,
  getFeaturedPosts,
  getLatestPosts,
  getPostsByTag,
} from '../controllers/postController.js';
import { protect } from '../middleware/auth.js';
import { postValidation, commentValidation } from '../utils/validators.js';

const router = express.Router();

router.route('/').get(getPosts).post(protect, postValidation, createPost);

router.get('/featured', getFeaturedPosts);
router.get('/latest', getLatestPosts);
router.get('/tag/:tag', getPostsByTag);
router.route('/search/:query').get(searchPosts);
router
  .route('/:id')
  .get(getPost)
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.route('/:id/like').put(protect, likePost);

router
  .route('/:id/comments')
  .get(getComments)
  .post(protect, commentValidation, addComment);

router.route('/:postId/comments/:commentId').delete(protect, deleteComment);

export default router;