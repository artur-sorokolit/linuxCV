import type { Request } from 'express';
import type { VisitorFootprint } from '../types';
import { clientIp } from './clientIp';
import { hashIp } from './ipHash';
import { summarizeUserAgent } from './userAgent';
import { requireVisitorToken } from './visitorToken';

/** Cloudflare adds this to proxied requests. Two letters, coarse on purpose. */
const country = (req: Request): string | null => {
  const raw = req.headers['cf-ipcountry'];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && value !== 'XX' ? value.toUpperCase().slice(0, 2) : null;
};

/** Everything the server remembers about who is asking. No raw address, no raw agent. */
export const visitorFootprint = (req: Request): VisitorFootprint => {
  const { browser, os, isBot } = summarizeUserAgent(req.headers['user-agent']);
  return {
    token: requireVisitorToken(req),
    ipHash: hashIp(clientIp(req)),
    browser,
    os,
    isBot,
    country: country(req),
  };
};
