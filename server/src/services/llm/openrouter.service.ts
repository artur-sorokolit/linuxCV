import axios, { AxiosError } from 'axios';
import { LLMProvider, ChatMessage } from '../../types';
import { config } from '../../config/env';
import { llmConfig } from '../../config/llm';
import { modelsService } from './models.service';
import { estimateTokens, fitHistoryToBudget } from './contextWindow';
import { CHAT_COMPLETIONS_URL, buildHeaders, ChatCompletionResponse } from './openrouterApi';

/** How many models to try before giving up, so one request can't walk the whole catalog. */
const MAX_ATTEMPTS = 4;
/** Cloudflare cuts a proxied request at 100s, so every attempt shares one shorter budget. */
export const TOTAL_BUDGET_MS = 45_000;
export const REQUEST_TIMEOUT_MS = 20_000;
const MIN_ATTEMPT_MS = 3_000;
/** Absorbs the gap between the character estimate and the model's real tokenizer. */
const CONTEXT_SAFETY_MARGIN_TOKENS = 512;

/** "provider" limits this model alone; "account" spends OpenRouter's free cap for every :free id. */
type RateLimitScope = 'provider' | 'account';

interface RateLimitInfo {
  scope: RateLimitScope | null;
  retryAfterSeconds?: number;
}

const isAuthError = (error: unknown): boolean => (error as { code?: string }).code === 'AUTH_ERROR';

// X-RateLimit-Reset carries no documented unit, so read an epoch-sized number as a
// timestamp and anything smaller as a delay. MAX_COOLDOWN_MS caps whichever it was.
const EPOCH_MS_FLOOR = 1e12;

const readWaitSeconds = (error: AxiosError): number | undefined => {
  const headers = error.response?.headers ?? {};
  const retryAfter = Number(headers['retry-after']);
  if (Number.isFinite(retryAfter)) {
    return retryAfter;
  }
  const reset = Number(headers['x-ratelimit-reset']);
  if (!Number.isFinite(reset)) {
    return undefined;
  }
  return reset >= EPOCH_MS_FLOOR ? (reset - Date.now()) / 1000 : reset;
};

const readRateLimit = (error: unknown): RateLimitInfo => {
  if (!axios.isAxiosError(error) || error.response?.status !== 429) {
    return { scope: null };
  }
  // Only a provider-side 429 names the upstream code; OpenRouter's own cap does not.
  const providerCode = error.response.data?.error?.metadata?.provider_code;
  return {
    scope: providerCode ? 'provider' : 'account',
    retryAfterSeconds: readWaitSeconds(error),
  };
};

const rateLimitError = (): Error =>
  Object.assign(
    new Error('The free models are all busy right now. Please try again in a moment.'),
    { code: 'RATE_LIMIT_EXCEEDED', status: 429 }
  );

export class OpenRouterService implements LLMProvider {
  constructor(private readonly apiKey = config.openrouterApiKey) {}

  async chat(
    message: string,
    history: ChatMessage[],
    model?: string
  ): Promise<{ reply: string; modelUsed: string }> {
    if (!this.apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    const candidates = await this.buildCandidates(model);
    const deadline = Date.now() + TOTAL_BUDGET_MS;
    let substantiveError: unknown = null;

    for (const currentModel of candidates) {
      const remainingMs = deadline - Date.now();
      if (remainingMs < MIN_ATTEMPT_MS) {
        break;
      }

      try {
        const timeoutMs = Math.min(REQUEST_TIMEOUT_MS, remainingMs);
        const reply = await this.sendRequest(message, history, currentModel, timeoutMs);
        return { reply, modelUsed: currentModel };
      } catch (error: unknown) {
        if (isAuthError(error)) {
          throw error;
        }
        console.warn(
          `⚠️ Model ${currentModel} failed: ${error instanceof Error ? error.message : String(error)}`
        );

        const { scope, retryAfterSeconds } = readRateLimit(error);
        if (scope === 'account') {
          // The cap is counted per account, so every remaining candidate is spent too.
          modelsService.markFreeTierLimited(retryAfterSeconds);
          break;
        }
        if (scope === 'provider') {
          // Remember it so neither the fallback nor the model picker offers it again yet.
          modelsService.markRateLimited(currentModel, retryAfterSeconds);
        } else {
          substantiveError = substantiveError ?? error;
        }
      }
    }

    throw substantiveError ?? rateLimitError();
  }

  /** Requested model first, then live free models, with everything cooling down excluded. */
  private async buildCandidates(requested?: string): Promise<string[]> {
    const preferred = requested || llmConfig.model;
    const servable = await modelsService.getServable().catch(() => null);
    if (!servable) {
      return [preferred];
    }

    const ids = servable.map((m) => m.id);
    const ordered = ids.includes(preferred)
      ? [preferred, ...ids.filter((id) => id !== preferred)]
      : ids;
    return ordered.slice(0, MAX_ATTEMPTS);
  }

  private async buildMessages(
    message: string,
    history: ChatMessage[],
    model: string
  ): Promise<ChatMessage[]> {
    const systemPrompt = llmConfig.systemPrompt;
    const contextLength = await modelsService.getContextLength(model);
    const historyBudget =
      contextLength -
      llmConfig.maxTokens -
      estimateTokens(systemPrompt) -
      estimateTokens(message) -
      CONTEXT_SAFETY_MARGIN_TOKENS;

    return [
      { role: 'system', content: systemPrompt },
      ...fitHistoryToBudget(history, historyBudget),
      { role: 'user', content: message },
    ];
  }

  private async sendRequest(
    message: string,
    history: ChatMessage[],
    model: string,
    timeoutMs: number
  ): Promise<string> {
    const { apiKey } = this;
    if (!apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    const messages = await this.buildMessages(message, history, model);
    console.log(
      `🤖 Sending request to OpenRouter (model: ${model}, messages: ${messages.length})...`
    );

    try {
      const response = await axios.post<ChatCompletionResponse>(
        CHAT_COMPLETIONS_URL,
        {
          model,
          messages,
          temperature: llmConfig.temperature,
          max_tokens: llmConfig.maxTokens,
        },
        { headers: buildHeaders(apiKey), timeout: timeoutMs }
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
