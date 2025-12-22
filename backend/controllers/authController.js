import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validationResult } from 'express-validator';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

// ==============================
// JWT TOKEN
// ==============================
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
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

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
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

    // ✉️ Send email
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

    // ✅ Handle duplicate verification request
    if (!user.otpHash && !user.otpExpiresAt) {
      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
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
