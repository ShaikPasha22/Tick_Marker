import { Types } from 'mongoose';
import { Goal } from '../models/Goal';
import { Habit } from '../models/Habit';
import { HabitCompletion } from '../models/HabitCompletion';

export class GoalSyncService {
  /**
   * Recalculates and updates the goal's currentValue based on completions
   * of any habits linked to this goal.
   */
  static async syncGoalProgress(goalId: string | Types.ObjectId): Promise<void> {
    try {
      const goal = await Goal.findById(goalId);
      if (!goal) return;

      // Find all active habits linked to this goal
      const habits = await Habit.find({ goalId, status: { $ne: 'archived' } });
      const habitIds = habits.map((h) => h._id);

      if (habitIds.length === 0) return;

      // Sum all completed and partial records for these habits
      const completions = await HabitCompletion.find({
        habitId: { $in: habitIds },
        status: { $in: ['completed', 'partial'] },
      });

      // Calculate total progress
      const totalProgress = completions.reduce((sum, c) => {
        const val = c.value !== undefined && c.value !== null
          ? c.value
          : (c.status === 'completed' ? 1 : 0);
        return sum + val;
      }, 0);

      goal.currentValue = totalProgress;

      // Auto-update status if target reached
      if (goal.currentValue >= goal.targetValue) {
        goal.status = 'completed';
      } else if (goal.status === 'completed') {
        goal.status = 'active'; // revert to active if completion is removed
      }

      await goal.save();
      console.log(`🎯 Goal Sync: Updated goal "${goal.title}" progress to ${totalProgress}/${goal.targetValue}`);
    } catch (err) {
      console.error('⚠️ Failed to sync goal progress:', err);
    }
  }
}
