import { createHash } from 'crypto';
import { config } from '../config/env';

/** Enough to keep visitors apart without carrying a full digest around. */
const HASH_LENGTH = 16;

/**
 * Groups visitors without identifying them. The salt is the whole point: an
 * unsalted IPv4 hash is reversible by brute force in minutes, a salted one is not.
 */
export const hashIp = (ip: string): string =>
  createHash('sha256').update(`${config.ipHashSalt}:${ip}`).digest('hex').slice(0, HASH_LENGTH);
