export interface UserAgentSummary {
  browser: string | null;
  os: string | null;
  isBot: boolean;
}

/** A raw User-Agent is a fingerprint. Browser and OS answer every question worth asking. */
const BOT =
  /bot|crawler|spider|crawl|slurp|curl|wget|python-requests|headless|lighthouse|monitor|preview|facebookexternalhit|slackbot|discordbot|whatsapp|telegrambot/i;

// Order matters: every Chromium browser also claims Chrome and Safari.
const BROWSERS: ReadonlyArray<readonly [RegExp, string]> = [
  [/Edg[A-Z]?\//, 'Edge'],
  [/(OPR|Opera)\//, 'Opera'],
  [/(Vivaldi)\//, 'Vivaldi'],
  [/Brave\//, 'Brave'],
  [/(SamsungBrowser)\//, 'Samsung Internet'],
  [/(Firefox|FxiOS)\//, 'Firefox'],
  [/(Chrome|CriOS)\//, 'Chrome'],
  [/Version\/[\d.]+.*Safari\//, 'Safari'],
];

// Android and CrOS both say Linux, so they have to be tested first.
const SYSTEMS: ReadonlyArray<readonly [RegExp, string]> = [
  [/Windows NT/, 'Windows'],
  [/Android/, 'Android'],
  [/(iPhone|iPad|iPod)/, 'iOS'],
  [/(Mac OS X|Macintosh)/, 'macOS'],
  [/CrOS/, 'ChromeOS'],
  [/Linux/, 'Linux'],
];

const firstMatch = (patterns: ReadonlyArray<readonly [RegExp, string]>, raw: string) =>
  patterns.find(([pattern]) => pattern.test(raw))?.[1] ?? null;

export const summarizeUserAgent = (raw: string | undefined): UserAgentSummary => {
  if (!raw) {
    return { browser: null, os: null, isBot: false };
  }
  if (BOT.test(raw)) {
    return { browser: null, os: null, isBot: true };
  }
  return { browser: firstMatch(BROWSERS, raw), os: firstMatch(SYSTEMS, raw), isBot: false };
};
