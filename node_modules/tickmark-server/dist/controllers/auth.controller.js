"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccount = exports.resetPassword = exports.forgotPassword = exports.updateMe = exports.getMe = exports.login = exports.register = void 0;
const crypto_1 = __importDefault(require("crypto"));
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const env_1 = require("../config/env");
const nodemailer_1 = __importDefault(require("nodemailer"));
// POST /api/auth/register
const register = async (req, res, next) => {
    try {
        const { name, email, password, timezone } = req.body;
        const existing = await User_1.User.findOne({ email: email.toLowerCase() });
        if (existing) {
            throw (0, errorHandler_1.createError)('An account with this email already exists', 409);
        }
        const user = new User_1.User({
            name,
            email,
            passwordHash: password, // Pre-save hook will hash it
            timezone: timezone || 'UTC',
        });
        await user.save();
        const token = (0, auth_1.generateToken)(user._id.toString());
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
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
// POST /api/auth/login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            throw (0, errorHandler_1.createError)('Invalid email or password', 401);
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw (0, errorHandler_1.createError)('Invalid email or password', 401);
        }
        const token = (0, auth_1.generateToken)(user._id.toString());
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
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
// GET /api/auth/me
const getMe = async (req, res, next) => {
    try {
        const user = await User_1.User.findById(req.userId).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
        if (!user)
            throw (0, errorHandler_1.createError)('User not found', 404);
        res.json({ user });
    }
    catch (error) {
        next(error);
    }
};
exports.getMe = getMe;
// PATCH /api/auth/me
const updateMe = async (req, res, next) => {
    try {
        const { name, timezone, weekStartDay, theme, gamificationEnabled, onboardingCompleted } = req.body;
        const user = await User_1.User.findByIdAndUpdate(req.userId, { name, timezone, weekStartDay, theme, gamificationEnabled, onboardingCompleted }, { new: true, runValidators: true }).select('-passwordHash -resetPasswordToken -resetPasswordExpires');
        if (!user)
            throw (0, errorHandler_1.createError)('User not found', 404);
        res.json({ user });
    }
    catch (error) {
        next(error);
    }
};
exports.updateMe = updateMe;
// POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User_1.User.findOne({ email: email.toLowerCase() });
        // Always return success to prevent email enumeration
        if (!user) {
            res.json({ message: 'If an account exists, a reset link has been sent.' });
            return;
        }
        const token = crypto_1.default.randomBytes(32).toString('hex');
        user.resetPasswordToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
        user.resetPasswordExpires = new Date(Date.now() + parseInt(env_1.env.RESET_TOKEN_EXPIRY_MINS) * 60 * 1000);
        await user.save({ validateBeforeSave: false });
        const resetUrl = `${env_1.env.CLIENT_URL}/reset-password?token=${token}`;
        if (env_1.env.EMAIL_USER) {
            try {
                const transporter = nodemailer_1.default.createTransport({
                    host: env_1.env.EMAIL_HOST,
                    port: parseInt(env_1.env.EMAIL_PORT),
                    auth: { user: env_1.env.EMAIL_USER, pass: env_1.env.EMAIL_PASS },
                });
                await transporter.sendMail({
                    from: env_1.env.EMAIL_FROM,
                    to: user.email,
                    subject: 'TickMark — Password Reset',
                    html: `
            <h2>Reset Your Password</h2>
            <p>Click the link below to reset your password. This link expires in ${env_1.env.RESET_TOKEN_EXPIRY_MINS} minutes.</p>
            <a href="${resetUrl}">Reset Password</a>
            <p>If you didn't request this, please ignore this email.</p>
          `,
                });
            }
            catch {
                // Don't fail silently — reset token is saved regardless
                console.warn('Failed to send reset email');
            }
        }
        res.json({ message: 'If an account exists, a reset link has been sent.', devResetUrl: env_1.env.NODE_ENV === 'development' ? resetUrl : undefined });
    }
    catch (error) {
        next(error);
    }
};
exports.forgotPassword = forgotPassword;
// POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        const hashedToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
        const user = await User_1.User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });
        if (!user)
            throw (0, errorHandler_1.createError)('Invalid or expired reset token', 400);
        user.passwordHash = password; // Pre-save hook will hash
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        const authToken = (0, auth_1.generateToken)(user._id.toString());
        res.json({ message: 'Password reset successful', token: authToken });
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
// DELETE /api/auth/account
const deleteAccount = async (req, res, next) => {
    try {
        const { Habit } = await Promise.resolve().then(() => __importStar(require('../models/Habit')));
        const { HabitCompletion } = await Promise.resolve().then(() => __importStar(require('../models/HabitCompletion')));
        const { Goal } = await Promise.resolve().then(() => __importStar(require('../models/Goal')));
        await Promise.all([
            User_1.User.findByIdAndDelete(req.userId),
            Habit.deleteMany({ userId: req.userId }),
            HabitCompletion.deleteMany({ userId: req.userId }),
            Goal.deleteMany({ userId: req.userId }),
        ]);
        res.json({ message: 'Account deleted successfully' });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteAccount = deleteAccount;
//# sourceMappingURL=auth.controller.js.map