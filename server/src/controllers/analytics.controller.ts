import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { subDays, subWeeks, subMonths, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Habit } from '../models/Habit';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { getDaySummary, getRangeCompletionRate, getHabitAnalytics, getYearHeatmap, generateInsights } from '../services/analytics.service';
import { calculateStreak, getStreaksForHabits } from '../services/streak.service';
import { toUTCMidnight } from '../services/scheduling.service';

// GET /api/analytics/dashboard
export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const timezone = req.userTimezone || 'UTC';
    const today = toUTCMidnight(new Date());

    const habits = await Habit.find({ userId, status: { $ne: 'archived' }, showOnDashboard: { $ne: false } });

    // Today's summary
    const todaySummary = await getDaySummary(userId, today, habits);

    // Week/month completion rates
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekCompletionRate = await getRangeCompletionRate(userId, habits, weekStart, today);

    const monthStart = startOfMonth(today);
    const monthCompletionRate = await getRangeCompletionRate(userId, habits, monthStart, today);

    // Streaks
    const streakData = await getStreaksForHabits(habits, timezone);
    const currentBestStreak = Math.max(0, ...Object.values(streakData).map((s) => s.current));
    const longestEverStreak = Math.max(0, ...Object.values(streakData).map((s) => s.longest));

    // Pending habits today
    const pendingCount = todaySummary.scheduled - todaySummary.completed - todaySummary.skipped;

    // Habits at risk (completion rate dropped significantly)
    const lastMonthAnalytics = await getHabitAnalytics(
      userId, habits,
      subMonths(today, 1), today,
      timezone
    );
    const habitsAtRisk = lastMonthAnalytics
      .filter((a) => a.completionRate < 40 && a.totalScheduled > 3)
      .map((a) => a.habitId);

    // Total duration-type habit time this week (in minutes)
    const { HabitCompletion } = await import('../models/HabitCompletion');
    const weekCompletions = await HabitCompletion.find({
      userId,
      date: { $gte: weekStart, $lte: today },
      status: { $in: ['completed', 'partial'] },
    }).lean();

    const durationHabitIds = new Set(
      habits.filter((h) => h.type === 'duration').map((h) => h._id.toString())
    );
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
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/habits?from=&to=
export const getHabitAnalyticsEndpoint = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const timezone = req.userTimezone || 'UTC';
    const { from, to, habitId } = req.query;

    const fromDate = from ? toUTCMidnight(new Date(from as string)) : toUTCMidnight(subDays(new Date(), 30));
    const toDate = to ? toUTCMidnight(new Date(to as string)) : toUTCMidnight(new Date());

    const filter: Record<string, unknown> = { userId, status: { $ne: 'archived' } };
    if (habitId) filter._id = new Types.ObjectId(habitId as string);

    const habits = await Habit.find(filter);
    const analytics = await getHabitAnalytics(userId, habits, fromDate, toDate, timezone);

    res.json({ analytics, from: fromDate, to: toDate });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/streaks/:habitId
export const getHabitStreak = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.userId!;
    const timezone = req.userTimezone || 'UTC';

    const habit = await Habit.findOne({ _id: req.params.habitId, userId });
    if (!habit) throw createError('Habit not found', 404);

    const streak = await calculateStreak(habit, timezone);
    res.json({ streak });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/heatmap?year=
export const getHeatmap = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const { habitId } = req.query;

    const filter: Record<string, unknown> = { userId, status: { $ne: 'archived' } };
    if (habitId) filter._id = new Types.ObjectId(habitId as string);

    const habits = await Habit.find(filter);
    const heatmap = await getYearHeatmap(userId, habits, year);

    res.json({ year, heatmap });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/insights
export const getInsights = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const timezone = req.userTimezone || 'UTC';

    const habits = await Habit.find({ userId, status: 'active', showOnDashboard: { $ne: false } });
    const insights = await generateInsights(userId, habits, timezone);

    res.json({ insights });
  } catch (error) {
    next(error);
  }
};

// GET /api/analytics/weekly-review
export const getWeeklyReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = new Types.ObjectId(req.userId!);
    const timezone = req.userTimezone || 'UTC';
    const today = toUTCMidnight(new Date());
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const prevWeekStart = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
    const prevWeekEnd = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });

    const habits = await Habit.find({ userId, status: { $ne: 'archived' } });

    const [thisWeek, lastWeek, analytics] = await Promise.all([
      getRangeCompletionRate(userId, habits, weekStart, today),
      getRangeCompletionRate(userId, habits, prevWeekStart, prevWeekEnd),
      getHabitAnalytics(userId, habits, weekStart, today, timezone),
    ]);

    const sorted = [...analytics].sort((a, b) => b.completionRate - a.completionRate);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    const { HabitCompletion } = await import('../models/HabitCompletion');
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
  } catch (error) {
    next(error);
  }
};
