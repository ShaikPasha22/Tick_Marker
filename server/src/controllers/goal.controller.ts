import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Goal } from '../models/Goal';
import { Habit } from '../models/Habit';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';

// GET /api/goals
export const getGoals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const goals = await Goal.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ goals });
  } catch (error) {
    next(error);
  }
};

// POST /api/goals
export const createGoal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { createLinkedHabit, ...goalData } = req.body;
    const goal = new Goal({ ...goalData, userId: req.userId });
    await goal.save();

    if (createLinkedHabit) {
      const habit = new Habit({
        userId: req.userId,
        name: `Goal: ${goal.title}`,
        category: goal.category || 'Other',
        type: 'binary',
        goalId: goal._id,
        schedule: { frequency: 'daily' },
        icon: '🎯',
        color: '#6366f1',
        priority: 'medium',
      });
      await habit.save();

      goal.habitId = habit._id as any;
      await goal.save();
    }

    res.status(201).json({ goal });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/goals/:id
export const updateGoal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, createLinkedHabit, ...updateData } = req.body;
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) throw createError('Goal not found', 404);

    Object.assign(goal, updateData);
    await goal.save();

    if (createLinkedHabit && !goal.habitId) {
      const habit = new Habit({
        userId: req.userId,
        name: `Goal: ${goal.title}`,
        category: goal.category || 'Other',
        type: 'binary',
        goalId: goal._id,
        schedule: { frequency: 'daily' },
        icon: '🎯',
        color: '#6366f1',
        priority: 'medium',
      });
      await habit.save();

      goal.habitId = habit._id as any;
      await goal.save();
    }

    res.json({ goal });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/goals/:id
export const deleteGoal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await Goal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!result) throw createError('Goal not found', 404);
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    next(error);
  }
};
