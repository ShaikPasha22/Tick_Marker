import { Router } from 'express';
import { getHabits, createHabit, getHabit, updateHabit, deleteHabit, pauseHabit, resumeHabit, reorderHabits } from '../controllers/habit.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getHabits);
router.post('/', createHabit);
router.patch('/reorder', reorderHabits);
router.get('/:id', getHabit);
router.patch('/:id', updateHabit);
router.delete('/:id', deleteHabit);
router.post('/:id/pause', pauseHabit);
router.post('/:id/resume', resumeHabit);

export default router;
