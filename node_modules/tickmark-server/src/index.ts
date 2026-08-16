import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { connectDB } from './config/db';
import { errorHandler, notFound } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import habitRoutes from './routes/habit.routes';
import completionRoutes from './routes/completion.routes';
import goalRoutes from './routes/goal.routes';
import financeRoutes from './routes/finance.routes';
import tripRoutes from './routes/trip.routes';
import analyticsRoutes from './routes/analytics.routes';
import exportRoutes from './routes/export.routes';

const app = express();

// Security
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

// Auth endpoints — stricter limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts, please try again later.',
});
app.use('/api/auth/', authLimiter);

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/completions', completionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/export', exportRoutes);

// 404
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start
const PORT = parseInt(env.PORT);

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 TickMark server running on http://localhost:${PORT}`);
    console.log(`📡 Environment: ${env.NODE_ENV}`);
  });
};

start();

export default app;
