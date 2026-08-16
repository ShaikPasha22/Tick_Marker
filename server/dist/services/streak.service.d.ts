import { IHabit } from '../models/Habit';
export interface StreakResult {
    current: number;
    longest: number;
    lastCompletedDate?: Date;
}
/**
 * Calculate current and longest streak for a habit.
 *
 * Rules:
 * - Walk backwards from today.
 * - If the day is scheduled: must be 'completed' or 'skipped'. 'partial' counts if ≥ threshold (not implemented yet, treated as miss).
 * - If the day is paused: treated as skipped (no streak break).
 * - If the day is not scheduled: skip silently.
 * - First scheduled day with 'missed' or no record → streak broken.
 */
export declare function calculateStreak(habit: IHabit, timezone?: string): Promise<StreakResult>;
/**
 * Get streak data for multiple habits in one go.
 */
export declare function getStreaksForHabits(habits: IHabit[], timezone: string): Promise<Record<string, StreakResult>>;
//# sourceMappingURL=streak.service.d.ts.map