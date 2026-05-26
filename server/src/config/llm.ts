import { buildSystemPrompt } from '../services/prompt.service';

export const llmConfig = {
  model: 'z-ai/glm-4.5-air:free',
  get systemPrompt(): string {
    return buildSystemPrompt();
  },
  maxTokens: 1000,
  temperature: 0.2,
};
