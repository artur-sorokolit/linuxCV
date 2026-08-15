import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';
import { config } from '../config/env';

const GENERIC_MESSAGE = 'Internal Server Error';

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  const error = err instanceof Error ? err : new Error(String(err));
  const status = (err as { status?: number }).status || 500;
  const isServerFault = status >= 500;

  console.error(`[Error ${status}]:`, error.message);

  const apiError: ApiError = {
    // A 5xx reason is ours to debug, not the visitor's to read: it leaks internals.
    message: isServerFault ? GENERIC_MESSAGE : error.message || GENERIC_MESSAGE,
    code: (err as { code?: string }).code || 'INTERNAL_ERROR',
    details: config.env === 'development' ? err : undefined,
  };

  res.status(status).json({
    success: false,
    error: apiError,
  });
};
