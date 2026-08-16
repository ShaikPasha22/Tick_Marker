import { Types } from 'mongoose';
import { IHabit } from '../models/Habit';
export interface DaySummary {
    date: string;
    scheduled: number;
    completed: number;
    missed: number;
    skipped: number;
    partial: number;
    completionRate: number;
}
export interface HabitAnalytics {
    habitId: string;
    name: string;
    icon: string;
    color: string;
    completionRate: number;
    totalScheduled: number;
    totalCompleted: number;
    totalMissed: number;
    totalSkipped: number;
    currentStreak: number;
    longestStreak: number;
    averageValue?: number;
    totalValue?: number;
}
export interface DashboardSummary {
    today: DaySummary;
    weekCompletionRate: number;
    monthCompletionRate: number;
    currentBestStreak: number;
    longestEverStreak: number;
    totalTimeThisWeek: number;
    pendingHabitsCount: number;
    habitsAtRisk: string[];
}
/**
 * Get completion summary for a single day.
 */
export declare function getDaySummary(userId: Types.ObjectId, date: Date, habits: IHabit[]): Promise<DaySummary>;
/**
 * Get completion rate over a date range.
 */
export declare function getRangeCompletionRate(userId: Types.ObjectId, habits: IHabit[], from: Date, to: Date): Promise<number>;
/**
 * Get per-habit analytics over a date range.
 */
export declare function getHabitAnalytics(userId: Types.ObjectId, habits: IHabit[], from: Date, to: Date, timezone: string): Promise<HabitAnalytics[]>;
/**
 * Get year heatmap data — daily completion rates for a whole year.
 */
export declare function getYearHeatmap(userId: Types.ObjectId, habits: IHabit[], year: number): Promise<{
    date: string;
    rate: number;
    completed: number;
    scheduled: number;
}[]>;
/**
 * Generate smart insights based on user data.
 */
export declare function generateInsights(userId: Types.ObjectId, habits: IHabit[], timezone: string): Promise<string[]>;
//# sourceMappingURL=analytics.service.d.ts.map