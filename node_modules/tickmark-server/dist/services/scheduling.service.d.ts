import { IHabit, IPausePeriod } from '../models/Habit';
/**
 * Convert a UTC Date to a Date object representing the same local calendar date
 * in the user's timezone (time component is irrelevant for day-level checks).
 */
export declare function toLocalDate(utcDate: Date, timezone: string): Date;
/**
 * Check if a date falls within any of the habit's pause periods.
 */
export declare function isInPausePeriod(date: Date, pausePeriods: IPausePeriod[]): boolean;
/**
 * Determine if a habit is scheduled on a specific local date.
 * Returns false if the date is before the habit's startDate or after its endDate.
 */
export declare function isHabitScheduledOn(habit: IHabit, localDate: Date): boolean;
/**
 * Get all dates within a week (Mon–Sun or Sun–Sat) for which a habit is scheduled.
 */
export declare function getScheduledDaysInWeek(habit: IHabit, weekStart: Date): Date[];
/**
 * Check if a date is today (in the user's local date).
 */
export declare function isToday(date: Date, timezone: string): boolean;
/**
 * Normalize a date to UTC midnight (start of day in UTC).
 */
export declare function toUTCMidnight(date: Date): Date;
/**
 * Given a local YYYY-MM-DD string, return a UTC midnight Date for storage.
 */
export declare function dateStringToUTCMidnight(dateStr: string): Date;
/**
 * Format a Date to YYYY-MM-DD string.
 */
export declare function toDateString(date: Date): string;
//# sourceMappingURL=scheduling.service.d.ts.map