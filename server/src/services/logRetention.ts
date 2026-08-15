import { chatRepository } from '../repositories/chat.repository';

const DAY_MS = 24 * 60 * 60 * 1000;

const purge = (retentionDays: number) =>
  chatRepository
    .purgeLogsOlderThan(retentionDays)
    .then((removed) => removed > 0 && console.log(`🧹 Purged ${removed} expired chat log rows`))
    .catch((error: unknown) => console.error('🔴 Failed to purge chat logs:', error));

/** Disabled unless CHAT_LOG_RETENTION_DAYS is set, so no history disappears by surprise. */
export const startLogRetention = (retentionDays: number): (() => void) => {
  if (retentionDays <= 0) {
    return () => undefined;
  }

  void purge(retentionDays);
  const timer = setInterval(() => void purge(retentionDays), DAY_MS);
  timer.unref();
  return () => clearInterval(timer);
};
