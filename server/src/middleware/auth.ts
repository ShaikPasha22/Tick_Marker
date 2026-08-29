import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthRequest extends Request {
  userId?: string;
  userTimezone?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const token = authHeader.split(' ')[1];

    let decoded: { userId: string; timezone?: string };
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string; timezone?: string };
    } catch {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }

    // Timezone is embedded in the JWT — no DB lookup needed per request.
    // This eliminates a DB round-trip on every authenticated API call.
    req.userId = decoded.userId;
    req.userTimezone = decoded.timezone ?? 'UTC';
    next();
  } catch (error) {
    next(error);
  }
};

export const generateToken = (userId: string, timezone: string = 'UTC'): string => {
  return jwt.sign({ userId, timezone }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};
