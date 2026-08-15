import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { clientIp } from '../utils/clientIp';

const MINUTE = 60 * 1000;

const limiter = (windowMs: number, max: number, message: string) =>
  rateLimit({
    windowMs,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(clientIp(req)),
    message: { success: false, error: { message, code: 'RATE_LIMITED' } },
  });

/** Every model call spends a shared free-tier quota, so the chat gets the tightest budget. */
export const chatLimiter = limiter(
  5 * MINUTE,
  20,
  'Too many messages. Please wait a moment before sending another.'
);

/** Each submission sends a real email from a personal mailbox. */
export const contactLimiter = limiter(
  60 * MINUTE,
  3,
  'Too many submissions. Please try again later.'
);

export const apiLimiter = limiter(15 * MINUTE, 200, 'Too many requests. Please slow down.');
