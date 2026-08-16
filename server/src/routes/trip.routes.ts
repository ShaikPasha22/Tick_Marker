import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as tripController from '../controllers/trip.controller';

const router = Router();

router.use(authenticate);

// Trip CRUD
router.post('/', tripController.createTrip);
router.get('/', tripController.listTrips);
router.get('/:tripId', tripController.getTrip);
router.patch('/:tripId', tripController.updateTrip);
router.delete('/:tripId', tripController.deleteTrip);

// Analytics / Dashboard
router.get('/:tripId/dashboard', tripController.getDashboard);

// Participants
router.post('/:tripId/participants', tripController.addParticipant);
router.get('/:tripId/participants', tripController.listParticipants);

// Categories
router.post('/:tripId/categories', tripController.addCategory);
router.get('/:tripId/categories', tripController.listCategories);

// Expenses
router.post('/:tripId/expenses', tripController.createExpense);
router.get('/:tripId/expenses', tripController.listExpenses);
router.patch('/:tripId/expenses/:expenseId', tripController.updateExpense);
router.delete('/:tripId/expenses/:expenseId', tripController.deleteExpense);

export default router;
