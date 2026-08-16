import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { HabitCompletion } from '../models/HabitCompletion';
import { Habit } from '../models/Habit';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { toUTCMidnight } from '../services/scheduling.service';
import { isHabitScheduledOn } from '../services/scheduling.service';

// GET /api/completions
export const getCompletions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date, habitId, from, to } = req.query;
    const filter: Record<string, unknown> = { userId: req.userId };

    if (habitId) filter.habitId = new Types.ObjectId(habitId as string);

    if (date) {
      filter.date = toUTCMidnight(new Date(date as string));
    } else if (from || to) {
      filter.date = {};
      if (from) (filter.date as Record<string, unknown>)['$gte'] = toUTCMidnight(new Date(from as string));
      if (to) (filter.date as Record<string, unknown>)['$lte'] = toUTCMidnight(new Date(to as string));
    }

    const completions = await HabitCompletion.find(filter).sort({ date: -1 });
    res.json({ completions });
  } catch (error) {
    next(error);
  }
};

import { HabitService } from '../services/habit.service';

export const logCompletion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await HabitService.logCompletion(req.userId!, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

// PATCH /api/completions/:id
export const updateCompletion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, value, note } = req.body;

    const completion = await HabitCompletion.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        status,
        value,
        note,
        ...(status === 'completed' ? { completedAt: new Date() } : {}),
      },
      { new: true, runValidators: true }
    );

    if (!completion) throw createError('Completion record not found', 404);
    res.json({ completion });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/completions/:id
export const deleteCompletion = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await HabitCompletion.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    if (!result) throw createError('Completion record not found', 404);
    res.json({ message: 'Completion removed' });
  } catch (error) {
    next(error);
  }
};

// GET /api/completions/day — get all scheduled habits + completions for a day
export const getDayView = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { date } = req.query;
    if (!date) throw createError('date query parameter required', 400);

    const utcDate = toUTCMidnight(new Date(date as string));
    const habits = await Habit.find({ userId: req.userId, status: { $ne: 'archived' } });

    const scheduledHabits = habits.filter((h) => isHabitScheduledOn(h, utcDate));

    const completions = await HabitCompletion.find({
      userId: req.userId,
      date: utcDate,
    }).lean();

    const completionMap = new Map(completions.map((c) => [c.habitId.toString(), c]));

    const dayData = scheduledHabits.map((h) => ({
      habit: h,
      completion: completionMap.get(h._id.toString()) || null,
    }));

    res.json({ date: (date as string), habits: dayData, totalScheduled: scheduledHabits.length });
  } catch (error) {
    next(error);
  }
};
