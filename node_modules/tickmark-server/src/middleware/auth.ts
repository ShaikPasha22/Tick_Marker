import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../models/User';

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

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    } catch {
      res.status(401).json({ message: 'Invalid or expired token' });
      return;
    }

    const user = await User.findById(decoded.userId).select('_id timezone').lean();
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.userId = decoded.userId;
    req.userTimezone = user.timezone;
    next();
  } catch (error) {
    next(error);
  }
};

export const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
};
