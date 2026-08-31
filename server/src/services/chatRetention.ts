import { chatRepository } from '../repositories/chat.repository';

const DAY_MS = 24 * 60 * 60 * 1000;

const purge = (retentionDays: number) =>
  chatRepository
    .purgeConversationsOlderThan(retentionDays)
    .then((removed) => removed > 0 && console.log(`🧹 Purged ${removed} expired conversations`))
    .catch((error: unknown) => console.error('🔴 Failed to purge conversations:', error));

/** Disabled unless CHAT_RETENTION_DAYS is set, so no history disappears by surprise. */
export const startChatRetention = (retentionDays: number): (() => void) => {
  if (retentionDays <= 0) {
    return () => undefined;
  }

  void purge(retentionDays);
  const timer = setInterval(() => void purge(retentionDays), DAY_MS);
  timer.unref();
  return () => clearInterval(timer);
};
