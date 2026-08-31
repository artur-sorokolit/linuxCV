import { describe, it, expect } from 'vitest';
import { hashIp } from './ipHash';

describe('hashIp', () => {
  it('gives the same address the same hash, so a visitor stays groupable', () => {
    expect(hashIp('203.0.113.7')).toBe(hashIp('203.0.113.7'));
  });

  it('gives different addresses different hashes', () => {
    expect(hashIp('203.0.113.7')).not.toBe(hashIp('203.0.113.8'));
  });

  it('never carries the address itself', () => {
    expect(hashIp('203.0.113.7')).not.toContain('203');
  });

  it('is a short hex digest', () => {
    expect(hashIp('203.0.113.7')).toMatch(/^[0-9a-f]{16}$/);
  });

  it('handles the fallback the request layer uses when no address is known', () => {
    expect(hashIp('unknown')).toMatch(/^[0-9a-f]{16}$/);
  });
});
