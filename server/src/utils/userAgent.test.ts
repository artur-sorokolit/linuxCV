import { describe, it, expect } from 'vitest';
import { summarizeUserAgent } from './userAgent';

const FIREFOX_LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:128.0) Gecko/20100101 Firefox/128.0';
const CHROME_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const EDGE_WINDOWS = `${CHROME_WINDOWS} Edg/126.0.0.0`;
const SAFARI_IOS =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const GOOGLEBOT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

describe('summarizeUserAgent', () => {
  it('reads a plain desktop browser', () => {
    expect(summarizeUserAgent(FIREFOX_LINUX)).toEqual({
      browser: 'Firefox',
      os: 'Linux',
      isBot: false,
    });
  });

  it('does not mistake a Chromium browser for Chrome', () => {
    expect(summarizeUserAgent(EDGE_WINDOWS).browser).toBe('Edge');
  });

  it('still reads Chrome when nothing is layered on top of it', () => {
    expect(summarizeUserAgent(CHROME_WINDOWS)).toEqual({
      browser: 'Chrome',
      os: 'Windows',
      isBot: false,
    });
  });

  it('reads Safari only when it is really Safari', () => {
    expect(summarizeUserAgent(SAFARI_IOS)).toEqual({
      browser: 'Safari',
      os: 'iOS',
      isBot: false,
    });
  });

  it('prefers Android over the Linux it also claims', () => {
    expect(summarizeUserAgent(CHROME_ANDROID).os).toBe('Android');
  });

  it('flags a crawler and keeps nothing else about it', () => {
    expect(summarizeUserAgent(GOOGLEBOT)).toEqual({ browser: null, os: null, isBot: true });
  });

  it('survives a request that sends no agent at all', () => {
    expect(summarizeUserAgent(undefined)).toEqual({ browser: null, os: null, isBot: false });
  });

  it('reports an agent it cannot place rather than guessing', () => {
    expect(summarizeUserAgent('SomeNewBrowser/1.0')).toEqual({
      browser: null,
      os: null,
      isBot: false,
    });
  });
});
