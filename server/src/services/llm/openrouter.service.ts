import axios from 'axios';
import { LLMProvider, ChatMessage } from '../../types';
import { config } from '../../config/env';
import { llmConfig } from '../../config/llm';
import { modelsService } from './models.service';

/** How many models to try before giving up, so one request can't walk the whole catalog. */
const MAX_ATTEMPTS = 4;

interface RateLimitInfo {
  isRateLimit: boolean;
  retryAfterSeconds?: number;
}

const readRateLimit = (error: unknown): RateLimitInfo => {
  if (!axios.isAxiosError(error) || error.response?.status !== 429) {
    return { isRateLimit: false };
  }
  const metadata = error.response?.data?.error?.metadata;
  const retryAfter = Number(metadata?.retry_after_seconds ?? metadata?.headers?.['Retry-After']);
  return {
    isRateLimit: true,
    retryAfterSeconds: Number.isFinite(retryAfter) ? retryAfter : undefined,
  };
};

export class OpenRouterService implements LLMProvider {
  private readonly apiKey = config.openrouterApiKey;
  private readonly apiUrl = 'https://openrouter.ai/api/v1/chat/completions';

  async chat(
    message: string,
    history: ChatMessage[],
    model?: string
  ): Promise<{ reply: string; modelUsed: string }> {
    const candidates = await this.buildCandidates(model);
    let lastError: unknown = null;
    let allRateLimited = candidates.length > 0;

    for (const currentModel of candidates) {
      try {
        const reply = await this.sendRequest(message, history, currentModel);
        return { reply, modelUsed: currentModel };
      } catch (error: unknown) {
        const { isRateLimit, retryAfterSeconds } = readRateLimit(error);
        if (isRateLimit) {
          // Remember it so neither the fallback nor the model picker offers it again yet.
          modelsService.markRateLimited(currentModel, retryAfterSeconds);
        } else {
          allRateLimited = false;
        }
        console.warn(
          `⚠️ Model ${currentModel} failed: ${error instanceof Error ? error.message : String(error)}`
        );
        lastError = error;
      }
    }

    if (allRateLimited) {
      const limitErr = new Error(
        'The free models are all busy right now. Please try again in a moment.'
      );
      Object.assign(limitErr, { code: 'RATE_LIMIT_EXCEEDED', status: 429 });
      throw limitErr;
    }
    throw lastError || new Error('No free model was able to respond.');
  }

  /** Requested model first, then live free models that are not cooling down. */
  private async buildCandidates(requested?: string): Promise<string[]> {
    const available = await modelsService.getAvailable().catch(() => []);
    const ordered = available.map((m) => m.id);
    const preferred = requested || llmConfig.model;
    const candidates = [preferred, ...ordered.filter((id) => id !== preferred)];
    return candidates.slice(0, MAX_ATTEMPTS);
  }

  private async sendRequest(
    message: string,
    history: ChatMessage[],
    model: string
  ): Promise<string> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    const messages = [
      { role: 'system', content: llmConfig.systemPrompt },
      ...history,
      { role: 'user', content: message },
    ];
    console.log(`🤖 Sending request to OpenRouter (model: ${model})...`);

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model,
          messages,
          temperature: llmConfig.temperature,
          max_tokens: llmConfig.maxTokens,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://artur-sorokolit.uk',
            'X-Title': 'linuxCV',
          },
          timeout: 60000,
        }
      );

      const reply = response.data.choices?.[0]?.message?.content;
      if (!reply) {
        // Reasoning models can spend the whole budget before emitting an answer.
        throw new Error(`Model ${model} returned an empty response`);
      }
      return reply;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const data = error.response?.data;

        if (status === 401) {
          const authErr = new Error('Invalid API Key. Please check your OpenRouter configuration.');
          Object.assign(authErr, { code: 'AUTH_ERROR', status: 401 });
          throw authErr;
        }
        if (status !== 429 && data?.error?.message) {
          throw new Error(`OpenRouter Error: ${data.error.message}`);
        }
      }
      throw error;
    }
  }
}
