import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare const exportData: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const importData: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=export.controller.d.ts.map