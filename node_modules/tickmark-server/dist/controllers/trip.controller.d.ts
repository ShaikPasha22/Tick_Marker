import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const createTrip: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getTrip: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const listTrips: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateTrip: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteTrip: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const addParticipant: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const listParticipants: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const listCategories: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const addCategory: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createExpense: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const listExpenses: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateExpense: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteExpense: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getDashboard: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=trip.controller.d.ts.map