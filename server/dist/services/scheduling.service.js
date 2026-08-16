"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toLocalDate = toLocalDate;
exports.isInPausePeriod = isInPausePeriod;
exports.isHabitScheduledOn = isHabitScheduledOn;
exports.getScheduledDaysInWeek = getScheduledDaysInWeek;
exports.isToday = isToday;
exports.toUTCMidnight = toUTCMidnight;
exports.dateStringToUTCMidnight = dateStringToUTCMidnight;
exports.toDateString = toDateString;
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
/**
 * Convert a UTC Date to a Date object representing the same local calendar date
 * in the user's timezone (time component is irrelevant for day-level checks).
 */
function toLocalDate(utcDate, timezone) {
    return (0, date_fns_tz_1.toZonedTime)(utcDate, timezone);
}
/**
 * Check if a date falls within any of the habit's pause periods.
 */
function isInPausePeriod(date, pausePeriods) {
    const t = date.getTime();
    return pausePeriods.some((p) => p.from.getTime() <= t && t <= p.to.getTime());
}
/**
 * Determine if a habit is scheduled on a specific local date.
 * Returns false if the date is before the habit's startDate or after its endDate.
 */
function isHabitScheduledOn(habit, localDate) {
    const habitStart = toLocalDate(habit.startDate, 'UTC'); // startDate stored as UTC
    if (localDate < habitStart)
        return false;
    if (habit.endDate && localDate > toLocalDate(habit.endDate, 'UTC'))
        return false;
    const { frequency, days, everyXDays } = habit.schedule;
    switch (frequency) {
        case 'daily':
            return true;
        case 'specific_days': {
            const dayOfWeek = (0, date_fns_1.getDay)(localDate); // 0=Sun, 1=Mon…
            return (days ?? []).includes(dayOfWeek);
        }
        case 'every_x_days': {
            const diffDays = (0, date_fns_1.differenceInCalendarDays)(localDate, habitStart);
            return diffDays >= 0 && diffDays % (everyXDays ?? 1) === 0;
        }
        case 'monthly': {
            // Same day of month as startDate
            return (0, date_fns_1.getDate)(localDate) === (0, date_fns_1.getDate)(habitStart);
        }
        // For x_per_week and x_per_month: these are frequency-based, not day-specific.
        // All days of the week/month are eligible; streak/analytics logic handles the quota.
        case 'x_per_week':
        case 'x_per_month':
            return true;
        default:
            return false;
    }
}
/**
 * Get all dates within a week (Mon–Sun or Sun–Sat) for which a habit is scheduled.
 */
function getScheduledDaysInWeek(habit, weekStart) {
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        if (isHabitScheduledOn(habit, d)) {
            dates.push(d);
        }
    }
    return dates;
}
/**
 * Check if a date is today (in the user's local date).
 */
function isToday(date, timezone) {
    const now = (0, date_fns_tz_1.toZonedTime)(new Date(), timezone);
    const target = (0, date_fns_tz_1.toZonedTime)(date, timezone);
    return (now.getFullYear() === target.getFullYear() &&
        now.getMonth() === target.getMonth() &&
        now.getDate() === target.getDate());
}
/**
 * Normalize a date to UTC midnight (start of day in UTC).
 */
function toUTCMidnight(date) {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}
/**
 * Given a local YYYY-MM-DD string, return a UTC midnight Date for storage.
 */
function dateStringToUTCMidnight(dateStr) {
    const d = new Date(`${dateStr}T00:00:00.000Z`);
    return d;
}
/**
 * Format a Date to YYYY-MM-DD string.
 */
function toDateString(date) {
    return date.toISOString().slice(0, 10);
}
//# sourceMappingURL=scheduling.service.js.map