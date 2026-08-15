import type { Request } from 'express';

const firstHeaderValue = (value: string | string[] | undefined): string | undefined => {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw
    ?.split(',')
    .map((part) => part.trim())
    .find(Boolean);
};

export const clientIp = (req: Request): string =>
  firstHeaderValue(req.headers['cf-connecting-ip']) ??
  firstHeaderValue(req.headers['x-forwarded-for']) ??
  req.socket.remoteAddress ??
  'unknown';
