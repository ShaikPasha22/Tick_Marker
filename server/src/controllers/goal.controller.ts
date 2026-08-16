import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Goal } from '../models/Goal';
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
    const goal = new Goal({ ...req.body, userId: req.userId });
    await goal.save();
    res.status(201).json({ goal });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/goals/:id
export const updateGoal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId, ...updateData } = req.body;
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      updateData,
      { new: true, runValidators: true }
    );
    if (!goal) throw createError('Goal not found', 404);
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
