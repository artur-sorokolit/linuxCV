import { Request, Response, NextFunction } from 'express';
import { ZodType } from 'zod';
import { httpError } from '../utils/httpError';

type RequestPart = 'body' | 'params' | 'query';

const describe = (issues: { path: PropertyKey[]; message: string }[]): string =>
  issues.map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`).join(', ');

export const validate =
  <T>(schema: ZodType<T>, part: RequestPart = 'body') =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) {
      return next(httpError(400, 'VALIDATION_ERROR', describe(result.error.issues)));
    }

    Object.defineProperty(req, part, { value: result.data, writable: true, configurable: true });
    next();
  };
