import { buildSystemPrompt } from '../services/prompt.service';

export const llmConfig = {
  // OpenRouter's own router over the free models: it picks whichever one is
  // actually serving, which no pinned free model can promise.
  model: 'openrouter/free',
  get systemPrompt(): string {
    return buildSystemPrompt();
  },
  maxTokens: 1000,
  temperature: 0.2,
};
