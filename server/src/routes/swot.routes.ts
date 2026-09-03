import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getSwotAnalyses,
  getSwotAnalysis,
  createSwotAnalysis,
  updateSwotAnalysis,
  deleteSwotAnalysis,
  duplicateSwotAnalysis,
  getSwotItems,
  createSwotItem,
  updateSwotItem,
  deleteSwotItem
} from '../controllers/swot.controller';

const router = Router();

router.use(authenticate);

router.get('/', getSwotAnalyses);
router.post('/', createSwotAnalysis);
router.get('/:id', getSwotAnalysis);
router.patch('/:id', updateSwotAnalysis);
router.delete('/:id', deleteSwotAnalysis);
router.post('/:id/duplicate', duplicateSwotAnalysis);

router.get('/:id/items', getSwotItems);
router.post('/:id/items', createSwotItem);
router.patch('/:id/items/:itemId', updateSwotItem);
router.delete('/:id/items/:itemId', deleteSwotItem);

export default router;
