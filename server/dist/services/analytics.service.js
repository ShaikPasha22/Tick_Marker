"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDaySummary = getDaySummary;
exports.getRangeCompletionRate = getRangeCompletionRate;
exports.getHabitAnalytics = getHabitAnalytics;
exports.getYearHeatmap = getYearHeatmap;
exports.generateInsights = generateInsights;
const date_fns_1 = require("date-fns");
const HabitCompletion_1 = require("../models/HabitCompletion");
const scheduling_service_1 = require("./scheduling.service");
const streak_service_1 = require("./streak.service");
/**
 * Get completion summary for a single day.
 */
async function getDaySummary(userId, date, habits) {
    const dayKey = (0, scheduling_service_1.toUTCMidnight)(date);
    const dayStr = dayKey.toISOString().slice(0, 10);
    const scheduledHabits = habits.filter((h) => h.status !== 'archived' && (0, scheduling_service_1.isHabitScheduledOn)(h, date));
    const completions = await HabitCompletion_1.HabitCompletion.find({
        userId,
        date: dayKey,
        habitId: { $in: scheduledHabits.map((h) => h._id) },
    }).lean();
    const completionMap = new Map(completions.map((c) => [c.habitId.toString(), c.status]));
    let completed = 0, missed = 0, skipped = 0, partial = 0;
    const now = new Date();
    const isPast = date < (0, date_fns_1.startOfDay)(now);
    for (const h of scheduledHabits) {
        const status = completionMap.get(h._id.toString());
        if (status === 'completed')
            completed++;
        else if (status === 'skipped')
            skipped++;
        else if (status === 'partial')
            partial++;
        else if (isPast)
            missed++;
        // else: today, not yet done — pending
    }
    const total = scheduledHabits.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
        date: dayStr,
        scheduled: total,
        completed,
        missed,
        skipped,
        partial,
        completionRate,
    };
}
/**
 * Get completion rate over a date range.
 */
async function getRangeCompletionRate(userId, habits, from, to) {
    const days = (0, date_fns_1.eachDayOfInterval)({ start: from, end: to });
    let totalScheduled = 0;
    let totalCompleted = 0;
    const completions = await HabitCompletion_1.HabitCompletion.find({
        userId,
        date: { $gte: (0, scheduling_service_1.toUTCMidnight)(from), $lte: (0, scheduling_service_1.toUTCMidnight)(to) },
        status: 'completed',
    }).lean();
    const completedSet = new Set(completions.map((c) => `${c.habitId}-${c.date.toISOString().slice(0, 10)}`));
    for (const day of days) {
        for (const h of habits.filter((h) => h.status !== 'archived')) {
            if ((0, scheduling_service_1.isHabitScheduledOn)(h, day)) {
                totalScheduled++;
                if (completedSet.has(`${h._id}-${day.toISOString().slice(0, 10)}`)) {
                    totalCompleted++;
                }
            }
        }
    }
    return totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
}
/**
 * Get per-habit analytics over a date range.
 */
async function getHabitAnalytics(userId, habits, from, to, timezone) {
    const days = (0, date_fns_1.eachDayOfInterval)({ start: from, end: to });
    const completions = await HabitCompletion_1.HabitCompletion.find({
        userId,
        date: { $gte: (0, scheduling_service_1.toUTCMidnight)(from), $lte: (0, scheduling_service_1.toUTCMidnight)(to) },
    }).lean();
    const completionsByHabit = new Map();
    for (const c of completions) {
        const key = c.habitId.toString();
        if (!completionsByHabit.has(key))
            completionsByHabit.set(key, []);
        completionsByHabit.get(key).push(c);
    }
    const results = [];
    for (const habit of habits) {
        const hId = habit._id.toString();
        const habitCompletions = completionsByHabit.get(hId) ?? [];
        const cMap = new Map(habitCompletions.map((c) => [c.date.toISOString().slice(0, 10), c]));
        let scheduled = 0, completed = 0, missed = 0, skipped = 0;
        let totalValue = 0;
        for (const day of days) {
            if (!(0, scheduling_service_1.isHabitScheduledOn)(habit, day))
                continue;
            scheduled++;
            const c = cMap.get(day.toISOString().slice(0, 10));
            if (!c) {
                if (day < (0, date_fns_1.startOfDay)(new Date()))
                    missed++;
            }
            else if (c.status === 'completed') {
                completed++;
                totalValue += c.value ?? 0;
            }
            else if (c.status === 'missed')
                missed++;
            else if (c.status === 'skipped')
                skipped++;
        }
        const streak = await (0, streak_service_1.calculateStreak)(habit, timezone);
        results.push({
            habitId: hId,
            name: habit.name,
            icon: habit.icon,
            color: habit.color,
            completionRate: scheduled > 0 ? Math.round((completed / scheduled) * 100) : 0,
            totalScheduled: scheduled,
            totalCompleted: completed,
            totalMissed: missed,
            totalSkipped: skipped,
            currentStreak: streak.current,
            longestStreak: streak.longest,
            averageValue: completed > 0 ? Math.round(totalValue / completed) : undefined,
            totalValue: totalValue || undefined,
        });
    }
    return results;
}
/**
 * Get year heatmap data — daily completion rates for a whole year.
 */
async function getYearHeatmap(userId, habits, year) {
    const from = (0, date_fns_1.startOfYear)(new Date(year, 0, 1));
    const to = (0, date_fns_1.endOfYear)(new Date(year, 0, 1));
    const days = (0, date_fns_1.eachDayOfInterval)({ start: from, end: to });
    const completions = await HabitCompletion_1.HabitCompletion.find({
        userId,
        date: { $gte: from, $lte: to },
        status: 'completed',
    }).lean();
    const completedByDate = new Map();
    for (const c of completions) {
        const key = c.date.toISOString().slice(0, 10);
        if (!completedByDate.has(key))
            completedByDate.set(key, new Set());
        completedByDate.get(key).add(c.habitId.toString());
    }
    return days.map((day) => {
        const key = day.toISOString().slice(0, 10);
        const scheduledCount = habits.filter((h) => h.status !== 'archived' && (0, scheduling_service_1.isHabitScheduledOn)(h, day)).length;
        const completedCount = completedByDate.get(key)?.size ?? 0;
        const effectiveCompleted = Math.min(completedCount, scheduledCount);
        return {
            date: key,
            scheduled: scheduledCount,
            completed: effectiveCompleted,
            rate: scheduledCount > 0 ? Math.round((effectiveCompleted / scheduledCount) * 100) : 0,
        };
    });
}
/**
 * Generate smart insights based on user data.
 */
async function generateInsights(userId, habits, timezone) {
    const insights = [];
    const now = new Date();
    const thirtyDaysAgo = (0, date_fns_1.subDays)(now, 30);
    const sixtyDaysAgo = (0, date_fns_1.subDays)(now, 60);
    const recentAnalytics = await getHabitAnalytics(userId, habits, thirtyDaysAgo, now, timezone);
    const previousAnalytics = await getHabitAnalytics(userId, habits, sixtyDaysAgo, thirtyDaysAgo, timezone);
    for (let i = 0; i < recentAnalytics.length; i++) {
        const recent = recentAnalytics[i];
        const prev = previousAnalytics[i];
        const habit = habits.find((h) => h._id.toString() === recent.habitId);
        if (!habit)
            continue;
        // Improvement insight
        if (prev && prev.completionRate > 0) {
            const diff = recent.completionRate - prev.completionRate;
            if (diff >= 10) {
                insights.push(`Your ${habit.name} consistency improved by ${diff}% this month. Keep it up!`);
            }
            else if (diff <= -15) {
                insights.push(`Your ${habit.name} completion dropped by ${Math.abs(diff)}% this month. Consider reviewing your schedule.`);
            }
        }
        // Streak insight
        if (recent.currentStreak >= 7 && recent.currentStreak < 30) {
            insights.push(`You're on a ${recent.currentStreak}-day streak for ${habit.name}! 🔥`);
        }
        // Near record
        if (recent.currentStreak > 0 && recent.longestStreak > 0) {
            const daysAway = recent.longestStreak - recent.currentStreak;
            if (daysAway > 0 && daysAway <= 3) {
                insights.push(`You're ${daysAway} day${daysAway === 1 ? '' : 's'} away from your personal record for ${habit.name}!`);
            }
        }
        // Strongest habit
        if (recent.completionRate >= 90) {
            insights.push(`${habit.name} is your strongest habit with a ${recent.completionRate}% completion rate this month.`);
        }
        // Most missed
        if (recent.totalMissed > recent.totalCompleted && recent.totalScheduled > 3) {
            insights.push(`${habit.name} is frequently missed. You might want to adjust its schedule or reminder.`);
        }
    }
    // Day-of-week analysis (find best/worst day)
    // ... would require more complex aggregation — placeholder for now
    if (insights.length === 0) {
        insights.push('Start tracking your habits to see personalized insights here!');
    }
    return insights.slice(0, 5); // Return top 5 insights
}
//# sourceMappingURL=analytics.service.js.map