import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Habit } from '../models/Habit';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { GoalSyncService } from '../services/goalSync.service';

// GET /api/habits
export const getHabits = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, category, scope, goalId } = req.query;
    const filter: Record<string, unknown> = { userId: req.userId };
    if (status) filter.status = status;
    if (category) filter.category = category;

    if (scope === 'dashboard') {
      filter.showOnDashboard = { $ne: false };
    } else if (scope === 'goal' && goalId) {
      filter.goalId = new Types.ObjectId(goalId as string);
    } else if (scope === 'all') {
      // no extra filter
    } else {
      // default: dashboard view (hide goal-specific trackers)
      filter.showOnDashboard = { $ne: false };
    }

    const habits = await Habit.find(filter).sort({ order: 1, createdAt: 1 });
    res.json({ habits });
  } catch (error) {
    next(error);
  }
};

// POST /api/habits
export const createHabit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const habit = new Habit({ ...req.body, userId: req.userId });
    await habit.save();
    res.status(201).json({ habit });
  } catch (error) {
    next(error);
  }
};

// GET /api/habits/:id
export const getHabit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) throw createError('Habit not found', 404);
    res.json({ habit });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/habits/:id
export const updateHabit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Do not allow userId to be changed
    const { userId, ...updateData } = req.body;

    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!habit) throw createError('Habit not found', 404);
    res.json({ habit });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/habits/:id — soft delete (archive)
export const deleteHabit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { permanent, confirmLink } = req.query;

    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) throw createError('Habit not found', 404);

    if (habit.goalId && confirmLink !== 'true') {
      res.status(400).json({
        warning: true,
        message: `This tracker is linked to a Goal. Deleting it will remove it from the Goal. Proceed?`
      });
      return;
    }

    if (habit.goalId) {
      const { Goal } = await import('../models/Goal');
      await Goal.updateOne(
        { _id: habit.goalId, userId: req.userId },
        {
          $pull: { trackerIds: habit._id },
          $unset: { habitId: habit._id }
        }
      );
    }

    if (permanent === 'true') {
      const { HabitCompletion } = await import('../models/HabitCompletion');
      await Promise.all([
        Habit.findOneAndDelete({ _id: req.params.id, userId: req.userId }),
        HabitCompletion.deleteMany({ habitId: req.params.id, userId: req.userId }),
      ]);
    } else {
      await Habit.findOneAndUpdate(
        { _id: req.params.id, userId: req.userId },
        { status: 'archived' },
        { new: true }
      );
    }

    if (habit.goalId) {
      await GoalSyncService.syncGoalProgress(habit.goalId);
    }

    res.json({ message: 'Habit removed successfully' });
  } catch (error) {
    next(error);
  }
};

// POST /api/habits/:id/pause
export const pauseHabit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { from, to, reason } = req.body;
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) throw createError('Habit not found', 404);

    habit.status = 'paused';
    habit.pausePeriods.push({ from: new Date(from), to: new Date(to), reason });
    await habit.save();

    res.json({ habit });
  } catch (error) {
    next(error);
  }
};

// POST /api/habits/:id/resume
export const resumeHabit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'active' },
      { new: true }
    );
    if (!habit) throw createError('Habit not found', 404);
    res.json({ habit });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/habits/reorder
export const reorderHabits = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { order } = req.body; // [{ id, order }]
    const bulkOps = order.map(({ id, order: o }: { id: string; order: number }) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(id), userId: req.userId },
        update: { order: o },
      },
    }));
    await Habit.bulkWrite(bulkOps);
    res.json({ message: 'Reordered' });
  } catch (error) {
    next(error);
  }
};
