import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User } from '../models/User';
import { generateToken } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { env } from '../config/env';
import nodemailer from 'nodemailer';
import { ExpenseCategory, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../models/ExpenseCategory';
import { PaymentMethod } from '../models/PaymentMethod';
import { FinancialSettings } from '../models/FinancialSettings';

// POST /api/auth/register
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, password, timezone } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw createError('An account with this email already exists', 409);
    }

    const user = new User({
      name,
      email,
      passwordHash: password, // Pre-save hook will hash it
      timezone: timezone || 'UTC',
    });

    await user.save();

    // Seed default finance categories, payment method, and settings for the new user
    try {
      await Promise.all([
        ExpenseCategory.insertMany(
          DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({ ...cat, userId: user._id, type: 'expense', isDefault: true }))
        ),
        ExpenseCategory.insertMany(
          DEFAULT_INCOME_CATEGORIES.map((cat) => ({ ...cat, userId: user._id, type: 'income', isDefault: true }))
        ),
        PaymentMethod.create({ userId: user._id, name: 'Cash', icon: '💵', isDefault: true }),
        FinancialSettings.create({ userId: user._id, setupCompleted: false }),
      ]);
    } catch (seedError) {
      // Non-fatal: user is created; categories can be added later
      console.warn('Failed to seed default categories for new user:', seedError);
    }

    const token = generateToken(user._id.toString(), user.timezone);


    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        theme: user.theme,
        onboardingCompleted: user.onboardingCompleted,
        gamificationEnabled: user.gamificationEnabled,
        xp: user.xp,
        level: user.level,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw createError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw createError('Invalid email or password', 401);
    }

    const token = generateToken(user._id.toString(), user.timezone);


    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        theme: user.theme,
        weekStartDay: user.weekStartDay,
        onboardingCompleted: user.onboardingCompleted,
        gamificationEnabled: user.gamificationEnabled,
        xp: user.xp,
        level: user.level,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
export const getMe = async (req: Request & { userId?: string }, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
    if (!user) throw createError('User not found', 404);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/auth/me
export const updateMe = async (req: Request & { userId?: string }, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, timezone, weekStartDay, theme, gamificationEnabled, onboardingCompleted } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { name, timezone, weekStartDay, theme, gamificationEnabled, onboardingCompleted },
      { new: true, runValidators: true }
    ).select('-passwordHash -resetPasswordToken -resetPasswordExpires');

    if (!user) throw createError('User not found', 404);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/forgot-password
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always return success to prevent email enumeration
    if (!user) {
      res.json({ message: 'If an account exists, a reset link has been sent.' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpires = new Date(
      Date.now() + parseInt(env.RESET_TOKEN_EXPIRY_MINS) * 60 * 1000
    );
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;

    if (env.EMAIL_USER) {
      try {
        const transporter = nodemailer.createTransport({
          host: env.EMAIL_HOST,
          port: parseInt(env.EMAIL_PORT),
          auth: { user: env.EMAIL_USER, pass: env.EMAIL_PASS },
        });

        await transporter.sendMail({
          from: env.EMAIL_FROM,
          to: user.email,
          subject: 'TickMark — Password Reset',
          html: `
            <h2>Reset Your Password</h2>
            <p>Click the link below to reset your password. This link expires in ${env.RESET_TOKEN_EXPIRY_MINS} minutes.</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>If you didn't request this, please ignore this email.</p>
          `,
        });
      } catch {
        // Don't fail silently — reset token is saved regardless
        console.warn('Failed to send reset email');
      }
    }

    res.json({ message: 'If an account exists, a reset link has been sent.', devResetUrl: env.NODE_ENV === 'development' ? resetUrl : undefined });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/reset-password
export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) throw createError('Invalid or expired reset token', 400);

    user.passwordHash = password; // Pre-save hook will hash
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const authToken = generateToken(user._id.toString(), user.timezone);

    res.json({ message: 'Password reset successful', token: authToken });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/auth/account
export const deleteAccount = async (req: Request & { userId?: string }, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { Habit } = await import('../models/Habit');
    const { HabitCompletion } = await import('../models/HabitCompletion');
    const { Goal } = await import('../models/Goal');

    await Promise.all([
      User.findByIdAndDelete(req.userId),
      Habit.deleteMany({ userId: req.userId }),
      HabitCompletion.deleteMany({ userId: req.userId }),
      Goal.deleteMany({ userId: req.userId }),
    ]);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
};
