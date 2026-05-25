import express from 'express';
import { register, login, getMe, verifyOtp, googleAuth } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { registerValidation, loginValidation } from '../utils/validators.js';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.post('/verify-otp', verifyOtp);

// ── Google OAuth ────────────────────────────────────────────
// Accepts the id_token credential from @react-oauth/google popup
router.post('/google', googleAuth);

export default router;