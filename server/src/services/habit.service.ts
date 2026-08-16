import { Types } from 'mongoose';
import { HabitCompletion } from '../models/HabitCompletion';
import { Habit } from '../models/Habit';
import { createError } from '../middleware/errorHandler';
import { toUTCMidnight } from './scheduling.service';

export class HabitService {
  /**
   * Logs a completion for a habit programmatically.
   * Useful for both standard HTTP controllers and AI Command engines.
   */
  static async logCompletion(
    userId: string | Types.ObjectId,
    data: {
      habitId: string | Types.ObjectId;
      date: string | Date;
      status: 'completed' | 'skipped' | 'failed';
      value?: number;
      note?: string;
    }
  ) {
    const { habitId, date, status, value, note } = data;

    // Verify habit belongs to user
    const habit = await Habit.findOne({ _id: habitId, userId });
    if (!habit) {
      throw createError('Habit not found', 404);
    }

    const utcDate = toUTCMidnight(new Date(date));

    // Check if already exists — upsert
    const completion = await HabitCompletion.findOneAndUpdate(
      { habitId, userId, date: utcDate },
      {
        status,
        value,
        note,
        completedAt: status === 'completed' ? new Date() : undefined,
      },
      { new: true, upsert: true, runValidators: true }
    );

    return { completion, habit };
  }
}
