import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { errorHandler } from './errorHandler';
import { httpError } from '../utils/httpError';

const respond = (error: unknown) => {
  const json = vi.fn();
  const res = { status: vi.fn().mockReturnThis(), json } as unknown as Response;

  errorHandler(error, {} as Request, res, (() => undefined) as NextFunction);

  return {
    status: vi.mocked(res.status).mock.calls[0]?.[0],
    body: json.mock.calls[0]?.[0] as { error: { message: string; code: string } },
  };
};

describe('errorHandler', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  describe('when the failure is the caller fault', () => {
    it('answers with the status the error carries', () => {
      expect(respond(httpError(404, 'SESSION_NOT_FOUND', 'Chat session not found')).status).toBe(
        404
      );
    });

    it('explains what went wrong so the client can act on it', () => {
      const { body } = respond(httpError(400, 'VALIDATION_ERROR', 'message: Too big'));

      expect(body.error).toMatchObject({ message: 'message: Too big', code: 'VALIDATION_ERROR' });
    });

    it('passes a rate limit through with its own code', () => {
      const { body } = respond(httpError(429, 'RATE_LIMIT_EXCEEDED', 'All models are busy'));

      expect(body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('when the failure is ours', () => {
    it('answers with a server error status', () => {
      expect(respond(new Error('connection terminated unexpectedly')).status).toBe(500);
    });

    it('withholds the internal reason from the response', () => {
      const { body } = respond(new Error('password authentication failed for user "linuxcv"'));

      expect(body.error.message).toBe('Internal Server Error');
    });

    it('still records the real reason in the logs', () => {
      respond(new Error('password authentication failed for user "linuxcv"'));

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('500') as string,
        expect.stringContaining('password authentication failed') as string
      );
    });

    it('copes with something thrown that is not an error', () => {
      expect(respond('a bare string').status).toBe(500);
    });
  });
});
