import { subDays } from 'date-fns';
import { IHabit } from '../models/Habit';
import { HabitCompletion } from '../models/HabitCompletion';
import { isHabitScheduledOn, isInPausePeriod, toUTCMidnight } from './scheduling.service';

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
export async function calculateStreak(
  habit: IHabit,
  timezone: string = 'UTC'
): Promise<StreakResult> {
  const today = toUTCMidnight(new Date());

  // Fetch all completions for this habit, sorted desc
  const completions = await HabitCompletion.find({ habitId: habit._id })
    .sort({ date: -1 })
    .lean();

  // Build a map date-string → status
  const completionMap = new Map<string, string>();
  for (const c of completions) {
    completionMap.set(c.date.toISOString().slice(0, 10), c.status);
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let streakBroken = false;
  let lastCompletedDate: Date | undefined;
  let runningStreak = 0;

  const habitStart = toUTCMidnight(habit.startDate);
  const maxDaysBack = 730; // Look back up to 2 years

  for (let i = 0; i <= maxDaysBack; i++) {
    const date = toUTCMidnight(subDays(today, i));

    if (date < habitStart) break;

    // Check pause
    if (isInPausePeriod(date, habit.pausePeriods)) {
      // Paused days don't break or count toward streak
      continue;
    }

    if (!isHabitScheduledOn(habit, date)) {
      // Not scheduled — no effect on streak
      continue;
    }

    const dateKey = date.toISOString().slice(0, 10);
    const status = completionMap.get(dateKey);

    const isSuccess = status === 'completed' || status === 'skipped';
    const isMissed = !status || status === 'missed' || status === 'partial';

    if (isSuccess) {
      runningStreak++;
      if (!streakBroken) {
        currentStreak = runningStreak;
        if (!lastCompletedDate && status === 'completed') {
          lastCompletedDate = date;
        }
      }
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else if (isMissed) {
      // If this is today and not yet completed, don't break the streak
      // (user still has time today)
      if (i === 0) {
        // Today is not yet complete — don't break streak, just don't count it
        continue;
      }
      streakBroken = true;
      runningStreak = 0;
    }
  }

  return { current: currentStreak, longest: longestStreak, lastCompletedDate };
}

/**
 * Get streak data for multiple habits in one go.
 */
export async function getStreaksForHabits(
  habits: IHabit[],
  timezone: string
): Promise<Record<string, StreakResult>> {
  const results: Record<string, StreakResult> = {};
  await Promise.all(
    habits.map(async (h) => {
      results[h._id.toString()] = await calculateStreak(h, timezone);
    })
  );
  return results;
}
