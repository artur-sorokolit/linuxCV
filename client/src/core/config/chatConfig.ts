export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
};

/**
 * Only used when /api/chat/models cannot be reached. The free models OpenRouter
 * offers change over time, so the list is fetched at runtime rather than pinned
 * here; this single id asks OpenRouter to route to whichever one is serving.
 */
export const FALLBACK_MODEL: ChatModel = {
  id: 'openrouter/free',
  name: 'Free Models Router',
  provider: 'openrouter',
  contextLength: 0,
};
