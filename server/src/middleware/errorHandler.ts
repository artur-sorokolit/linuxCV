import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const error = err instanceof Error ? err : new Error(String(err));
  const status = (err as { status?: number }).status || 500;

  const apiError: ApiError = {
    message: error.message || 'Internal Server Error',
    code: (err as { code?: string }).code || 'INTERNAL_ERROR',
    details: process.env.NODE_ENV === 'development' ? err : undefined,
  };

  console.error(`[Error ${status}]:`, apiError.message);

  res.status(status).json({
    success: false,
    error: apiError,
  });
};
