import { describe, it, expect } from 'vitest';
import type { Request } from 'express';
import { requireVisitorToken, VISITOR_HEADER } from './visitorToken';

const VALID_TOKEN = '11111111-1111-4111-8111-111111111111';

const requestWith = (headers: Record<string, string>) => ({ headers }) as unknown as Request;

describe('requireVisitorToken', () => {
  it('returns the token a browser sends with its request', () => {
    const request = requestWith({ [VISITOR_HEADER]: VALID_TOKEN });

    expect(requireVisitorToken(request)).toBe(VALID_TOKEN);
  });

  it('rejects a caller that identifies itself with something other than a uuid', () => {
    const request = requestWith({ [VISITOR_HEADER]: 'admin' });

    expect(() => requireVisitorToken(request)).toThrow(
      expect.objectContaining({ status: 400 }) as Error
    );
  });

  it('rejects a caller that sends no identity at all', () => {
    expect(() => requireVisitorToken(requestWith({}))).toThrow(
      expect.objectContaining({ status: 400 }) as Error
    );
  });

  it('rejects an empty identity rather than treating it as a shared owner', () => {
    const request = requestWith({ [VISITOR_HEADER]: '' });

    expect(() => requireVisitorToken(request)).toThrow(
      expect.objectContaining({ status: 400 }) as Error
    );
  });
});
