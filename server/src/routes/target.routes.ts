import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getTargets,
  createTarget,
  updateTarget,
  deleteTarget
} from '../controllers/target.controller';

const router = Router();

router.use(authenticate);

router.get('/', getTargets);
router.post('/', createTarget);
router.patch('/:id', updateTarget);
router.delete('/:id', deleteTarget);

export default router;
