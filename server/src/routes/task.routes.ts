import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  linkSwotItemToTask
} from '../controllers/task.controller';

const router = Router();

router.use(authenticate);

router.get('/', getTasks);
router.post('/', createTask);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/link', linkSwotItemToTask);

export default router;
