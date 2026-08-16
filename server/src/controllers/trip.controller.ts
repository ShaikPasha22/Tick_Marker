import { Response, NextFunction } from 'express';
import { TripService } from '../services/trip.service';
import { TripExpenseService } from '../services/trip-expense.service';
import { TripAnalyticsService } from '../services/trip-analytics.service';
import { AuthRequest } from '../middleware/auth';

// Trip Controllers
export const createTrip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trip = await TripService.createTrip(req.userId!, req.body);
    res.status(201).json({ status: 'success', data: { trip } });
  } catch (error) {
    next(error);
  }
};

export const getTrip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trip = await TripService.getTrip(req.userId!, req.params.tripId);
    res.json({ status: 'success', data: { trip } });
  } catch (error) {
    next(error);
  }
};

export const listTrips = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trips = await TripService.listTrips(req.userId!, req.query.status as string);
    res.json({ status: 'success', data: { trips } });
  } catch (error) {
    next(error);
  }
};

export const updateTrip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const trip = await TripService.updateTrip(req.userId!, req.params.tripId, req.body);
    res.json({ status: 'success', data: { trip } });
  } catch (error) {
    next(error);
  }
};

export const deleteTrip = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await TripService.deleteTrip(req.userId!, req.params.tripId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Participant Controllers
export const addParticipant = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const participant = await TripService.addParticipant(req.userId!, req.params.tripId, req.body.name, req.body.avatar);
    res.status(201).json({ status: 'success', data: { participant } });
  } catch (error) {
    next(error);
  }
};

export const listParticipants = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const participants = await TripService.listParticipants(req.userId!, req.params.tripId);
    res.json({ status: 'success', data: { participants } });
  } catch (error) {
    next(error);
  }
};

// Category Controllers
export const listCategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const categories = await TripService.listCategories(req.userId!, req.params.tripId);
    res.json({ status: 'success', data: { categories } });
  } catch (error) {
    next(error);
  }
};

export const addCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await TripService.addCustomCategory(req.userId!, req.params.tripId, req.body);
    res.status(201).json({ status: 'success', data: { category } });
  } catch (error) {
    next(error);
  }
};

// Expense Controllers
export const createExpense = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const expense = await TripExpenseService.createExpense(req.userId!, req.params.tripId, req.body);
    res.status(201).json({ status: 'success', data: { expense } });
  } catch (error) {
    next(error);
  }
};

export const listExpenses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const expenses = await TripExpenseService.listExpenses(req.userId!, req.params.tripId, req.query);
    res.json({ status: 'success', data: { expenses } });
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const expense = await TripExpenseService.updateExpense(req.userId!, req.params.tripId, req.params.expenseId, req.body);
    res.json({ status: 'success', data: { expense } });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await TripExpenseService.deleteExpense(req.userId!, req.params.tripId, req.params.expenseId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Analytics Controller
export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const dashboard = await TripAnalyticsService.getDashboard(req.userId!, req.params.tripId);
    res.json({ status: 'success', data: dashboard });
  } catch (error) {
    next(error);
  }
};
