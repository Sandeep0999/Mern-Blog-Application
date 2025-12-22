import express from 'express';
import { generateBlogContent } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/generate', protect, generateBlogContent);

export default router;
