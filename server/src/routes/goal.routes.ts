import { Router } from 'express';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  createGoalTracker,
  linkExistingTracker,
  unlinkGoalTracker,
  toggleTrackerDashboardVisibility
} from '../controllers/goal.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getGoals);
router.post('/', createGoal);
router.patch('/:id', updateGoal);
router.delete('/:id', deleteGoal);

router.post('/:id/trackers', createGoalTracker);
router.post('/:id/trackers/link', linkExistingTracker);
router.delete('/:id/trackers/:habitId', unlinkGoalTracker);
router.patch('/:id/trackers/:habitId/dashboard', toggleTrackerDashboardVisibility);

export default router;
