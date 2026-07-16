import { buildSystemPrompt } from '../services/prompt.service';

export const llmConfig = {
  // Measured the most dependable of the free models: answered 5/5 at ~0.8s with a
  // 1M context. openrouter/free is the tempting alternative, but it routes ~1 in 8
  // requests into a non-chat model. If this one is rate-limited or ever leaves the
  // catalog, the fallback walks the live list, so it is a preference, not a pin.
  model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
  get systemPrompt(): string {
    return buildSystemPrompt();
  },
  maxTokens: 1000,
  temperature: 0.2,
};
