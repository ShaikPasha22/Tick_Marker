import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  if (env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
    res.status(statusCode).json({
      message,
      stack: err.stack,
    });
    return;
  }

  res.status(statusCode).json({ message });
};

export const createError = (message: string, statusCode: number): AppError => {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
};
