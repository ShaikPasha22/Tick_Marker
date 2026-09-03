import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Goal } from '../models/Goal';
import { Habit } from '../models/Habit';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../middleware/errorHandler';
import { GoalSyncService } from '../services/goalSync.service';

// GET /api/goals
export const getGoals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const goals = await Goal.find({ userId: req.userId }).sort({ createdAt: -1 });
    const updatedGoals = [];
    for (const goal of goals) {
      let changed = false;
      if (!goal.trackerIds) {
        goal.trackerIds = [];
        changed = true;
      }
      if (goal.habitId && !goal.trackerIds.some(id => id.toString() === goal.habitId!.toString())) {
        goal.trackerIds.push(goal.habitId);
        changed = true;
      }
      if (changed) {
        await goal.save();
      }
      updatedGoals.push(goal);
    }
    res.json({ goals: updatedGoals });
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
        showOnDashboard: true,
        isGoalTracker: true,
      });
      await habit.save();

      goal.habitId = habit._id as any;
      goal.trackerIds = [habit._id as any];
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
        showOnDashboard: true,
        isGoalTracker: true,
      });
      await habit.save();

      goal.habitId = habit._id as any;
      if (!goal.trackerIds) goal.trackerIds = [];
      if (!goal.trackerIds.some(id => id.toString() === habit._id.toString())) {
        goal.trackerIds.push(habit._id as any);
      }
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

// POST /api/goals/:id/trackers
export const createGoalTracker = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) throw createError('Goal not found', 404);

    const habit = new Habit({
      ...req.body,
      userId: req.userId,
      goalId: goal._id,
      isGoalTracker: true,
    });
    await habit.save();

    if (!goal.trackerIds) {
      goal.trackerIds = [];
    }
    goal.trackerIds.push(habit._id as any);
    await goal.save();

    res.status(201).json({ habit, goal });
  } catch (error) {
    next(error);
  }
};

// POST /api/goals/:id/trackers/link
export const linkExistingTracker = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { habitId } = req.body;
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) throw createError('Goal not found', 404);

    const habit = await Habit.findOne({ _id: habitId, userId: req.userId });
    if (!habit) throw createError('Habit not found', 404);

    habit.goalId = goal._id as any;
    await habit.save();

    if (!goal.trackerIds) {
      goal.trackerIds = [];
    }
    if (!goal.trackerIds.some(id => id.toString() === habit._id.toString())) {
      goal.trackerIds.push(habit._id as any);
    }
    await goal.save();

    await GoalSyncService.syncGoalProgress(goal._id);
    const updatedGoal = await Goal.findById(goal._id);

    res.json({ habit, goal: updatedGoal });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/goals/:id/trackers/:habitId
export const unlinkGoalTracker = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) throw createError('Goal not found', 404);

    const habit = await Habit.findOne({ _id: req.params.habitId, userId: req.userId });
    if (habit) {
      habit.goalId = undefined;
      await habit.save();
    }

    if (goal.trackerIds) {
      goal.trackerIds = goal.trackerIds.filter((id) => id.toString() !== req.params.habitId);
    }
    if (goal.habitId && goal.habitId.toString() === req.params.habitId) {
      goal.habitId = undefined;
    }
    await goal.save();

    await GoalSyncService.syncGoalProgress(goal._id);
    const updatedGoal = await Goal.findById(goal._id);

    res.json({ goal: updatedGoal, message: 'Tracker unlinked from goal successfully' });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/goals/:id/trackers/:habitId/dashboard
export const toggleTrackerDashboardVisibility = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { showOnDashboard } = req.body;
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) throw createError('Goal not found', 404);

    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.habitId, userId: req.userId },
      { showOnDashboard },
      { new: true }
    );
    if (!habit) throw createError('Habit not found', 404);

    res.json({ habit });
  } catch (error) {
    next(error);
  }
};

