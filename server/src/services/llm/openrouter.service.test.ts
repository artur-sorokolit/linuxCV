import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import { OpenRouterService, TOTAL_BUDGET_MS, REQUEST_TIMEOUT_MS } from './openrouter.service';
import { modelsService } from './models.service';
import { llmConfig } from '../../config/llm';
import type { ChatMessage, ChatModel } from '../../types';

vi.mock('axios');
vi.mock('../../config/env', () => ({
  config: { openrouterApiKey: 'test-key' },
}));

const PREFERRED = 'vendor/preferred:free';
const BACKUP = 'vendor/backup:free';
const THIRD = 'vendor/third:free';

const model = (id: string, contextLength = 128000): ChatModel => ({
  id,
  name: id,
  provider: 'vendor',
  contextLength,
});

const answersWith = (reply: string) => ({
  data: { choices: [{ message: { content: reply } }] },
});

const httpError = (
  status: number,
  data: unknown = {},
  headers: Record<string, string> = {}
): AxiosError => {
  const error = new AxiosError('request failed');
  error.response = {
    status,
    data,
    statusText: '',
    headers,
    config: { headers: new AxiosHeaders() },
  };
  return error;
};

const providerRateLimited = (retryAfterSeconds?: number) =>
  httpError(
    429,
    { error: { metadata: { provider_code: 'rate_limit_exceeded' } } },
    retryAfterSeconds === undefined ? {} : { 'retry-after': String(retryAfterSeconds) }
  );

const platformRateLimited = (resetAt?: number) =>
  httpError(
    429,
    { error: { metadata: { error_type: 'rate_limit_exceeded' } } },
    resetAt === undefined ? {} : { 'x-ratelimit-reset': String(resetAt) }
  );

const sentModels = () =>
  vi.mocked(axios.post).mock.calls.map((call) => (call[1] as { model: string }).model);

const sentMessages = (callIndex = 0) =>
  (vi.mocked(axios.post).mock.calls[callIndex]?.[1] as { messages: ChatMessage[] }).messages;

describe('OpenRouterService', () => {
  let service: OpenRouterService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(axios.post).mockReset();
    vi.mocked(axios.isAxiosError).mockImplementation(
      (payload): payload is AxiosError => payload instanceof AxiosError
    );
    vi.spyOn(modelsService, 'getServable').mockResolvedValue([
      model(PREFERRED),
      model(BACKUP),
      model(THIRD),
    ]);
    vi.spyOn(modelsService, 'getContextLength').mockResolvedValue(128000);
    vi.spyOn(modelsService, 'markRateLimited').mockImplementation(() => undefined);
    vi.spyOn(modelsService, 'markFreeTierLimited').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(llmConfig, 'systemPrompt', 'get').mockReturnValue('SYSTEM PROMPT');
    service = new OpenRouterService();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('when the requested model answers', () => {
    it('returns its reply', async () => {
      vi.mocked(axios.post).mockResolvedValue(answersWith('Hello there'));

      const result = await service.chat('hi', [], PREFERRED);

      expect(result.reply).toBe('Hello there');
    });

    it('reports which model produced the reply', async () => {
      vi.mocked(axios.post).mockResolvedValue(answersWith('Hello there'));

      const result = await service.chat('hi', [], PREFERRED);

      expect(result.modelUsed).toBe(PREFERRED);
    });

    it('tries the requested model before any other', async () => {
      vi.mocked(axios.post).mockResolvedValue(answersWith('Hello there'));

      await service.chat('hi', [], THIRD);

      expect(sentModels()[0]).toBe(THIRD);
    });

    it('leads the conversation with the portfolio system prompt', async () => {
      vi.mocked(axios.post).mockResolvedValue(answersWith('Hello there'));

      await service.chat('hi', [], PREFERRED);

      expect(sentMessages()[0]?.role).toBe('system');
    });

    it('closes the conversation with the new question', async () => {
      vi.mocked(axios.post).mockResolvedValue(answersWith('Hello there'));

      await service.chat('what is your stack?', [], PREFERRED);

      expect(sentMessages().at(-1)).toEqual({ role: 'user', content: 'what is your stack?' });
    });
  });

  describe('when a model fails', () => {
    it('falls back to the next model in the catalog', async () => {
      vi.mocked(axios.post)
        .mockRejectedValueOnce(httpError(500))
        .mockResolvedValue(answersWith('from the backup'));

      const result = await service.chat('hi', [], PREFERRED);

      expect(result).toEqual({ reply: 'from the backup', modelUsed: BACKUP });
    });

    it('treats an empty completion as a failure worth retrying elsewhere', async () => {
      vi.mocked(axios.post)
        .mockResolvedValueOnce({ data: { choices: [{ message: { content: '' } }] } })
        .mockResolvedValue(answersWith('from the backup'));

      const result = await service.chat('hi', [], PREFERRED);

      expect(result.modelUsed).toBe(BACKUP);
    });

    it('stops immediately on a bad api key instead of burning the catalog', async () => {
      vi.mocked(axios.post).mockRejectedValue(httpError(401));

      await expect(service.chat('hi', [], PREFERRED)).rejects.toMatchObject({
        code: 'AUTH_ERROR',
      });
      expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(1);
    });

    it('surfaces the first substantive failure rather than a trailing rate limit', async () => {
      vi.mocked(axios.post)
        .mockRejectedValueOnce(httpError(500, { error: { message: 'model exploded' } }))
        .mockRejectedValue(providerRateLimited(30));

      await expect(service.chat('hi', [], PREFERRED)).rejects.toThrow(/model exploded/);
    });
  });

  describe('when a provider rate limits one model', () => {
    it('answers from the next model, because the limit is that provider only', async () => {
      vi.mocked(axios.post)
        .mockRejectedValueOnce(providerRateLimited(45))
        .mockResolvedValue(answersWith('from the backup'));

      const result = await service.chat('hi', [], PREFERRED);

      expect(result.modelUsed).toBe(BACKUP);
    });

    it('remembers the limit so the model stops being offered', async () => {
      vi.mocked(axios.post)
        .mockRejectedValueOnce(providerRateLimited(45))
        .mockResolvedValue(answersWith('ok'));

      await service.chat('hi', [], PREFERRED);

      expect(modelsService.markRateLimited).toHaveBeenCalledWith(PREFERRED, 45);
    });

    it('leaves the rest of the free tier alone', async () => {
      vi.mocked(axios.post)
        .mockRejectedValueOnce(providerRateLimited(45))
        .mockResolvedValue(answersWith('ok'));

      await service.chat('hi', [], PREFERRED);

      expect(modelsService.markFreeTierLimited).not.toHaveBeenCalled();
    });

    it('tells the visitor to retry when every model is limited', async () => {
      vi.mocked(axios.post).mockRejectedValue(providerRateLimited(30));

      await expect(service.chat('hi', [], PREFERRED)).rejects.toMatchObject({
        code: 'RATE_LIMIT_EXCEEDED',
        status: 429,
      });
    });
  });

  describe('when the account free quota is spent', () => {
    it('gives up after one attempt instead of walking models that share the cap', async () => {
      vi.mocked(axios.post).mockRejectedValue(platformRateLimited());

      await expect(service.chat('hi', [], PREFERRED)).rejects.toMatchObject({
        code: 'RATE_LIMIT_EXCEEDED',
      });
      expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(1);
    });

    it('withholds the whole free tier rather than the model that happened to answer', async () => {
      vi.mocked(axios.post).mockRejectedValue(platformRateLimited());

      await expect(service.chat('hi', [], PREFERRED)).rejects.toThrow();

      expect(modelsService.markFreeTierLimited).toHaveBeenCalled();
      expect(modelsService.markRateLimited).not.toHaveBeenCalled();
    });

    it('holds off until the quota window resets', async () => {
      const inTenMinutes = Date.now() + 10 * 60 * 1000;
      vi.mocked(axios.post).mockRejectedValue(platformRateLimited(inTenMinutes));

      await expect(service.chat('hi', [], PREFERRED)).rejects.toThrow();

      expect(modelsService.markFreeTierLimited).toHaveBeenCalledWith(600);
    });

    it('reports the outage when the catalog has nothing servable left', async () => {
      vi.mocked(modelsService.getServable).mockResolvedValue([]);

      await expect(service.chat('hi', [], PREFERRED)).rejects.toMatchObject({
        code: 'RATE_LIMIT_EXCEEDED',
      });
      expect(vi.mocked(axios.post)).not.toHaveBeenCalled();
    });

    it('never retries a model already known to be cooling down', async () => {
      vi.mocked(modelsService.getServable).mockResolvedValue([model(BACKUP)]);
      vi.mocked(axios.post).mockResolvedValue(answersWith('ok'));

      await service.chat('hi', [], PREFERRED);

      expect(sentModels()).toEqual([BACKUP]);
    });
  });

  describe('when attempts are slow', () => {
    it('gives up before the caller times out instead of walking the whole catalog', async () => {
      vi.mocked(axios.post).mockImplementation(async (_url, _body, requestConfig) => {
        vi.advanceTimersByTime((requestConfig as { timeout: number }).timeout);
        throw httpError(500);
      });
      const startedAt = Date.now();

      await expect(service.chat('hi', [], PREFERRED)).rejects.toThrow();

      expect(Date.now() - startedAt).toBeLessThanOrEqual(TOTAL_BUDGET_MS);
    });

    it('never lets a single attempt run longer than its own timeout', async () => {
      vi.mocked(axios.post).mockResolvedValue(answersWith('ok'));

      await service.chat('hi', [], PREFERRED);

      const timeout = (vi.mocked(axios.post).mock.calls[0]?.[2] as { timeout: number }).timeout;
      expect(timeout).toBeLessThanOrEqual(REQUEST_TIMEOUT_MS);
    });

    it('shortens the last attempt to whatever budget remains', async () => {
      vi.mocked(axios.post).mockImplementationOnce(async () => {
        vi.advanceTimersByTime(TOTAL_BUDGET_MS - 5000);
        throw httpError(500);
      });
      vi.mocked(axios.post).mockResolvedValue(answersWith('just in time'));

      await service.chat('hi', [], PREFERRED);

      const lastCall = vi.mocked(axios.post).mock.calls.at(-1);
      expect((lastCall?.[2] as { timeout: number }).timeout).toBeLessThanOrEqual(5000);
    });
  });

  describe('when the conversation is long', () => {
    it('drops the oldest exchanges so the request fits the model window', async () => {
      vi.mocked(modelsService.getContextLength).mockResolvedValue(16000);
      vi.mocked(axios.post).mockResolvedValue(answersWith('ok'));
      const history: ChatMessage[] = Array.from({ length: 60 }, (_, i) => [
        { role: 'user' as const, content: `question ${i} `.repeat(60) },
        { role: 'assistant' as const, content: `answer ${i} `.repeat(60) },
      ]).flat();

      await service.chat('and now?', history, PREFERRED);

      expect(sentMessages().length).toBeLessThan(history.length);
    });

    it('keeps the newest exchange when it has to cut', async () => {
      vi.mocked(modelsService.getContextLength).mockResolvedValue(16000);
      vi.mocked(axios.post).mockResolvedValue(answersWith('ok'));
      const history: ChatMessage[] = Array.from({ length: 60 }, (_, i) => [
        { role: 'user' as const, content: `question ${i} `.repeat(60) },
        { role: 'assistant' as const, content: `answer ${i} `.repeat(60) },
      ]).flat();

      await service.chat('and now?', history, PREFERRED);

      expect(sentMessages().at(-2)).toEqual(history.at(-1));
    });

    it('sends the full history when the window is roomy', async () => {
      vi.mocked(axios.post).mockResolvedValue(answersWith('ok'));
      const history: ChatMessage[] = [
        { role: 'user', content: 'first' },
        { role: 'assistant', content: 'second' },
      ];

      await service.chat('third', history, PREFERRED);

      expect(sentMessages()).toHaveLength(4);
    });
  });

  describe('when the api key is missing', () => {
    it('fails without reaching out to the network', async () => {
      vi.spyOn(service, 'chat');
      const keyless = new OpenRouterService('');

      await expect(keyless.chat('hi', [], PREFERRED)).rejects.toThrow(/not configured/);
      expect(vi.mocked(axios.post)).not.toHaveBeenCalled();
    });
  });
});
