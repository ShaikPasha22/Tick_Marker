import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    userId?: string;
    userTimezone?: string;
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const generateToken: (userId: string) => string;
//# sourceMappingURL=auth.d.ts.map