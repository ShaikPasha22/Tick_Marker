import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getHabits: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const createHabit: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getHabit: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateHabit: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteHabit: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const pauseHabit: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const resumeHabit: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const reorderHabits: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=habit.controller.d.ts.map