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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWeeklyReview = exports.getInsights = exports.getHeatmap = exports.getHabitStreak = exports.getHabitAnalyticsEndpoint = exports.getDashboard = void 0;
const mongoose_1 = require("mongoose");
const date_fns_1 = require("date-fns");
const Habit_1 = require("../models/Habit");
const errorHandler_1 = require("../middleware/errorHandler");
const analytics_service_1 = require("../services/analytics.service");
const streak_service_1 = require("../services/streak.service");
const scheduling_service_1 = require("../services/scheduling.service");
// GET /api/analytics/dashboard
const getDashboard = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const timezone = req.userTimezone || 'UTC';
        const today = (0, scheduling_service_1.toUTCMidnight)(new Date());
        const habits = await Habit_1.Habit.find({ userId, status: { $ne: 'archived' } });
        // Today's summary
        const todaySummary = await (0, analytics_service_1.getDaySummary)(userId, today, habits);
        // Week/month completion rates
        const weekStart = (0, date_fns_1.startOfWeek)(today, { weekStartsOn: 1 });
        const weekCompletionRate = await (0, analytics_service_1.getRangeCompletionRate)(userId, habits, weekStart, today);
        const monthStart = (0, date_fns_1.startOfMonth)(today);
        const monthCompletionRate = await (0, analytics_service_1.getRangeCompletionRate)(userId, habits, monthStart, today);
        // Streaks
        const streakData = await (0, streak_service_1.getStreaksForHabits)(habits, timezone);
        const currentBestStreak = Math.max(0, ...Object.values(streakData).map((s) => s.current));
        const longestEverStreak = Math.max(0, ...Object.values(streakData).map((s) => s.longest));
        // Pending habits today
        const pendingCount = todaySummary.scheduled - todaySummary.completed - todaySummary.skipped;
        // Habits at risk (completion rate dropped significantly)
        const lastMonthAnalytics = await (0, analytics_service_1.getHabitAnalytics)(userId, habits, (0, date_fns_1.subMonths)(today, 1), today, timezone);
        const habitsAtRisk = lastMonthAnalytics
            .filter((a) => a.completionRate < 40 && a.totalScheduled > 3)
            .map((a) => a.habitId);
        // Total duration-type habit time this week (in minutes)
        const { HabitCompletion } = await Promise.resolve().then(() => __importStar(require('../models/HabitCompletion')));
        const weekCompletions = await HabitCompletion.find({
            userId,
            date: { $gte: weekStart, $lte: today },
            status: { $in: ['completed', 'partial'] },
        }).lean();
        const durationHabitIds = new Set(habits.filter((h) => h.type === 'duration').map((h) => h._id.toString()));
        const totalTimeThisWeek = weekCompletions
            .filter((c) => durationHabitIds.has(c.habitId.toString()))
            .reduce((sum, c) => sum + (c.value || 0), 0);
        res.json({
            today: todaySummary,
            weekCompletionRate,
            monthCompletionRate,
            currentBestStreak,
            longestEverStreak,
            totalTimeThisWeek,
            pendingHabitsCount: Math.max(0, pendingCount),
            habitsAtRisk,
            streaks: streakData,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getDashboard = getDashboard;
// GET /api/analytics/habits?from=&to=
const getHabitAnalyticsEndpoint = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const timezone = req.userTimezone || 'UTC';
        const { from, to, habitId } = req.query;
        const fromDate = from ? (0, scheduling_service_1.toUTCMidnight)(new Date(from)) : (0, scheduling_service_1.toUTCMidnight)((0, date_fns_1.subDays)(new Date(), 30));
        const toDate = to ? (0, scheduling_service_1.toUTCMidnight)(new Date(to)) : (0, scheduling_service_1.toUTCMidnight)(new Date());
        const filter = { userId, status: { $ne: 'archived' } };
        if (habitId)
            filter._id = new mongoose_1.Types.ObjectId(habitId);
        const habits = await Habit_1.Habit.find(filter);
        const analytics = await (0, analytics_service_1.getHabitAnalytics)(userId, habits, fromDate, toDate, timezone);
        res.json({ analytics, from: fromDate, to: toDate });
    }
    catch (error) {
        next(error);
    }
};
exports.getHabitAnalyticsEndpoint = getHabitAnalyticsEndpoint;
// GET /api/analytics/streaks/:habitId
const getHabitStreak = async (req, res, next) => {
    try {
        const userId = req.userId;
        const timezone = req.userTimezone || 'UTC';
        const habit = await Habit_1.Habit.findOne({ _id: req.params.habitId, userId });
        if (!habit)
            throw (0, errorHandler_1.createError)('Habit not found', 404);
        const streak = await (0, streak_service_1.calculateStreak)(habit, timezone);
        res.json({ streak });
    }
    catch (error) {
        next(error);
    }
};
exports.getHabitStreak = getHabitStreak;
// GET /api/analytics/heatmap?year=
const getHeatmap = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const { habitId } = req.query;
        const filter = { userId, status: { $ne: 'archived' } };
        if (habitId)
            filter._id = new mongoose_1.Types.ObjectId(habitId);
        const habits = await Habit_1.Habit.find(filter);
        const heatmap = await (0, analytics_service_1.getYearHeatmap)(userId, habits, year);
        res.json({ year, heatmap });
    }
    catch (error) {
        next(error);
    }
};
exports.getHeatmap = getHeatmap;
// GET /api/analytics/insights
const getInsights = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const timezone = req.userTimezone || 'UTC';
        const habits = await Habit_1.Habit.find({ userId, status: 'active' });
        const insights = await (0, analytics_service_1.generateInsights)(userId, habits, timezone);
        res.json({ insights });
    }
    catch (error) {
        next(error);
    }
};
exports.getInsights = getInsights;
// GET /api/analytics/weekly-review
const getWeeklyReview = async (req, res, next) => {
    try {
        const userId = new mongoose_1.Types.ObjectId(req.userId);
        const timezone = req.userTimezone || 'UTC';
        const today = (0, scheduling_service_1.toUTCMidnight)(new Date());
        const weekStart = (0, date_fns_1.startOfWeek)(today, { weekStartsOn: 1 });
        const prevWeekStart = (0, date_fns_1.startOfWeek)((0, date_fns_1.subWeeks)(today, 1), { weekStartsOn: 1 });
        const prevWeekEnd = (0, date_fns_1.endOfWeek)((0, date_fns_1.subWeeks)(today, 1), { weekStartsOn: 1 });
        const habits = await Habit_1.Habit.find({ userId, status: { $ne: 'archived' } });
        const [thisWeek, lastWeek, analytics] = await Promise.all([
            (0, analytics_service_1.getRangeCompletionRate)(userId, habits, weekStart, today),
            (0, analytics_service_1.getRangeCompletionRate)(userId, habits, prevWeekStart, prevWeekEnd),
            (0, analytics_service_1.getHabitAnalytics)(userId, habits, weekStart, today, timezone),
        ]);
        const sorted = [...analytics].sort((a, b) => b.completionRate - a.completionRate);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];
        const { HabitCompletion } = await Promise.resolve().then(() => __importStar(require('../models/HabitCompletion')));
        const durationHabitIds = new Set(habits.filter((h) => h.type === 'duration').map((h) => h._id.toString()));
        const weekCompletions = await HabitCompletion.find({
            userId,
            date: { $gte: weekStart, $lte: today },
        }).lean();
        const totalTime = weekCompletions
            .filter((c) => durationHabitIds.has(c.habitId.toString()))
            .reduce((sum, c) => sum + (c.value || 0), 0);
        res.json({
            thisWeekRate: thisWeek,
            lastWeekRate: lastWeek,
            improvement: thisWeek - lastWeek,
            bestHabit: best,
            worstHabit: worst,
            totalTimeMinutes: totalTime,
            bestStreak: Math.max(0, ...analytics.map((a) => a.currentStreak)),
            habitCount: analytics.length,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getWeeklyReview = getWeeklyReview;
//# sourceMappingURL=analytics.controller.js.map