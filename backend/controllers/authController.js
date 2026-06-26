import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';
import { OAuth2Client } from 'google-auth-library';

// ==============================
// JWT TOKEN
// ==============================
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

// ── Shared helper: build the auth response object ──
const authPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar || '',
  authProvider: user.authProvider || 'local',
  following: user.following || [],
  token: generateToken(user._id),
});

// ==============================
// GOOGLE AUTH (one-tap / popup)
// ==============================
export const googleAuth = async (req, res) => {
  try {
    const { credential, access_token } = req.body;

    if (!credential && !access_token) {
      return res.status(400).json({ message: 'Google token is required' });
    }

    let googleId, email, name, picture;

    if (access_token) {
      // ── Implicit flow: exchange access_token for userinfo ──
      const userInfoRes = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`
      );
      if (!userInfoRes.ok) {
        return res.status(401).json({ message: 'Invalid Google access token' });
      }
      const info = await userInfoRes.json();
      googleId = info.sub;
      email    = info.email;
      name     = info.name;
      picture  = info.picture;

    } else {
      // ── One-tap / popup flow: verify id_token ──
      const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      googleId = payload.sub;
      email    = payload.email;
      name     = payload.name;
      picture  = payload.picture;
    }

    if (!email) {
      return res.status(400).json({ message: 'Google account has no email' });
    }

    // 1. Find by googleId first
    let user = await User.findOne({ googleId });

    if (!user) {
      // 2. Find by email — link existing local account to Google
      user = await User.findOne({ email });

      if (user) {
        // Link this Google account to the existing local account
        user.googleId = googleId;
        if (user.authProvider !== 'google') user.authProvider = 'google';
        if (!user.avatar && picture) user.avatar = picture;
        await user.save();
      } else {
        // 3. Brand-new user — create a Google-only account
        user = await User.create({
          name,
          email,
          googleId,
          authProvider: 'google',
          avatar: picture || '',
        });
      }
    }

    res.json(authPayload(user));
  } catch (error) {
    console.error('GOOGLE AUTH ERROR:', error);
    if (error.message?.includes('Token used too late') || error.message?.includes('token')) {
      return res.status(401).json({ message: 'Google token expired, please try again' });
    }
    res.status(500).json({ message: 'Google authentication failed' });
  }
};

// ==============================
// REGISTER
// ==============================
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    res.status(201).json(authPayload(user));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// LOGIN → SEND OTP
// ==============================
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // ⛔ Prevent regenerating OTP if one is still valid
    if (
      user.otpHash &&
      user.otpExpiresAt &&
      user.otpExpiresAt > Date.now()
    ) {
      return res.json({
        message: 'OTP already sent to your email',
        userId: user._id,
      });
    }

    // 🔐 Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    user.otpHash = otpHash;
    user.otpExpiresAt = Date.now() + 5 * 60 * 1000; // 5 min
    await user.save();

    console.log('LOGIN OTP:', otp);
    console.log('LOGIN OTP HASH:', otpHash);
    console.log('OTP EXPIRES AT:', user.otpExpiresAt);

    // ✉️ Send email (non-fatal — OTP is also logged to console in dev)
    try {
      await sendEmail({
        to: user.email,
        subject: 'Your DailyPen Login OTP',
        html: `
          <h2>Login Verification</h2>
          <p>Your OTP is:</p>
          <h1>${otp}</h1>
          <p>This code expires in 5 minutes.</p>
        `,
      });
    } catch (emailErr) {
      console.error('LOGIN EMAIL ERROR (non-fatal):', emailErr.message);
      // Continue — OTP is logged to console and still works
    }

    res.json({
      message: 'OTP sent to your email',
      userId: user._id,
    });
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};

// ==============================
// VERIFY OTP
// ==============================
export const verifyOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!otp || !userId) {
      return res.status(400).json({ message: 'OTP required' });
    }

    const cleanOtp = otp.trim();
    const user = await User.findById(userId).select('+otpHash +otpExpiresAt');

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!user.otpHash || !user.otpExpiresAt) {
      return res.status(400).json({ message: 'No active OTP session. Please login again.' });
    }

    if (user.otpExpiresAt < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    const otpHash = crypto
      .createHash('sha256')
      .update(cleanOtp)
      .digest('hex');

    if (otpHash !== user.otpHash) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // ✅ Clear OTP
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar || '',
      following: user.following || [],
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('VERIFY OTP ERROR:', error);
    res.status(500).json({ message: error.message });
  }
};


export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
