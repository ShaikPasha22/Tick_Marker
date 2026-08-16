import { Router } from 'express';
import { getCompletions, logCompletion, updateCompletion, deleteCompletion, getDayView } from '../controllers/completion.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', getCompletions);
router.get('/day', getDayView);
router.post('/', logCompletion);
router.patch('/:id', updateCompletion);
router.delete('/:id', deleteCompletion);

export default router;
