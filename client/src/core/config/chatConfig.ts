export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
};

/**
 * Only used when /api/chat/models cannot be reached. The free models OpenRouter
 * offers change over time, so the list is fetched at runtime rather than pinned
 * here. This mirrors the server's default (see server/src/config/llm.ts); if it
 * drifts, the server still falls back to a model that is actually serving.
 */
export const FALLBACK_MODEL: ChatModel = {
  id: 'nvidia/nemotron-3-ultra-550b-a55b:free',
  name: 'Nemotron 3 Ultra',
  provider: 'nvidia',
  contextLength: 1000000,
};
