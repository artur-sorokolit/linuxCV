import type { Request } from 'express';
import { z } from 'zod';
import { httpError } from './httpError';

export const VISITOR_HEADER = 'x-visitor-id';

const tokenSchema = z.uuid();

/**
 * Identifies the browser that owns a chat session. It is not authentication:
 * it stops one visitor from listing and reading another visitor's conversations.
 */
export const requireVisitorToken = (req: Request): string => {
  const result = tokenSchema.safeParse(req.headers[VISITOR_HEADER]);
  if (!result.success) {
    throw httpError(400, 'VISITOR_ID_REQUIRED', `A valid ${VISITOR_HEADER} header is required`);
  }
  return result.data;
};
