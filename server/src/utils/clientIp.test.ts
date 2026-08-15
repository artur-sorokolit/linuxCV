import { describe, it, expect } from 'vitest';
import type { Request } from 'express';
import { clientIp } from './clientIp';

const requestWith = (headers: Record<string, string | string[]>, socketAddress?: string) =>
  ({
    headers,
    socket: { remoteAddress: socketAddress },
  }) as unknown as Request;

describe('clientIp', () => {
  it('prefers the Cloudflare header over everything else', () => {
    const request = requestWith(
      { 'cf-connecting-ip': '203.0.113.7', 'x-forwarded-for': '198.51.100.1' },
      '10.0.0.1'
    );

    expect(clientIp(request)).toBe('203.0.113.7');
  });

  it('takes the originating address from a forwarded chain', () => {
    const request = requestWith({ 'x-forwarded-for': '203.0.113.7, 198.51.100.1' }, '10.0.0.1');

    expect(clientIp(request)).toBe('203.0.113.7');
  });

  it('falls back to the socket address when no proxy headers are present', () => {
    const request = requestWith({}, '10.0.0.1');

    expect(clientIp(request)).toBe('10.0.0.1');
  });

  it('reports unknown when nothing identifies the caller', () => {
    const request = requestWith({});

    expect(clientIp(request)).toBe('unknown');
  });

  it('ignores an empty forwarded header instead of returning a blank key', () => {
    const request = requestWith({ 'x-forwarded-for': '  ' }, '10.0.0.1');

    expect(clientIp(request)).toBe('10.0.0.1');
  });
});
