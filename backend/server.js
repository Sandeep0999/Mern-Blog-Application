
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import mongoose from 'mongoose';

// Route imports
import authRoutes from './routes/auth.js';
import postRoutes from './routes/post.js';
import userRoutes from './routes/user.js';
import adminRoutes from './routes/admin.js';
import aiRoutes from './routes/ai.js';
import reportRoutes from './routes/report.js';

dotenv.config();

// Connect to database
connectDB();

const app = express();

// Security middleware
app.use(helmet());
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Stricter rate limiting for sensitive auth routes (login, register, OTP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // limit each IP to 15 auth/OTP attempts per 15 minutes
  message: 'Too many authentication attempts from this IP, please try again later.',
});

// Report submission rate limiter — prevent spam reporting
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 reports per 15 minutes per IP
  message: 'Too many reports submitted. Please wait before reporting again.',
});

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS configuration accepting comma-separated production origins or developer fallbacks
const allowedOrigins = process.env.CLIENT_URL 
  ? process.env.CLIENT_URL.split(',').map(origin => origin.trim()) 
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.includes(origin) || 
        origin.endsWith('.vercel.app') || 
        /^http:\/\/localhost:\d+$/.test(origin);
        
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportLimiter, reportRoutes);

// Health check (verifies Node server status + active database connection)
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  if (dbState === 1) {
    res.json({ status: 'ok', database: states[dbState] });
  } else {
    res.status(503).json({ status: 'error', database: states[dbState] });
  }
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});