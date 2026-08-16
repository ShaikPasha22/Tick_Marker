import { Router } from 'express';
import { getDashboard, getHabitAnalyticsEndpoint, getHabitStreak, getHeatmap, getInsights, getWeeklyReview } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboard);
router.get('/habits', getHabitAnalyticsEndpoint);
router.get('/streaks/:habitId', getHabitStreak);
router.get('/heatmap', getHeatmap);
router.get('/insights', getInsights);
router.get('/weekly-review', getWeeklyReview);

export default router;
