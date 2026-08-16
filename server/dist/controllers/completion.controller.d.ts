import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const getCompletions: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const logCompletion: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const updateCompletion: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const deleteCompletion: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const getDayView: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=completion.controller.d.ts.map