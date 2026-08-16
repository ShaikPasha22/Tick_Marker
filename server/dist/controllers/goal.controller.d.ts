import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getGoals: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createGoal: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateGoal: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteGoal: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=goal.controller.d.ts.map