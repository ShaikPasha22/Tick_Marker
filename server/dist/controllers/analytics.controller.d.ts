import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getDashboard: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getHabitAnalyticsEndpoint: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getHabitStreak: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getHeatmap: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getInsights: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getWeeklyReview: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=analytics.controller.d.ts.map