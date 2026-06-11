import { buildSystemPrompt } from '../services/prompt.service';

export const llmConfig = {
  model: 'meta-llama/llama-3.3-70b-instruct:free',
  get systemPrompt(): string {
    return buildSystemPrompt();
  },
  maxTokens: 1000,
  temperature: 0.2,
};
