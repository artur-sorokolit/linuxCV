import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios, { AxiosError, AxiosHeaders } from 'axios';
import { OpenRouterScopeGate } from './scopeGate';
import { llmConfig } from '../../config/llm';

vi.mock('axios');
vi.mock('../../config/env', () => ({
  config: { openrouterApiKey: 'test-key' },
}));

const verdict = (text: string) => ({ data: { choices: [{ message: { content: text } }] } });

const httpError = (status: number): AxiosError => {
  const error = new AxiosError('gate failed');
  error.response = {
    status,
    data: {},
    statusText: '',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
  };
  return error;
};

const sentBody = (callIndex = 0) =>
  vi.mocked(axios.post).mock.calls[callIndex]?.[1] as {
    model: string;
    messages: { role: string; content: string }[];
    reasoning?: { enabled: boolean };
  };

describe('OpenRouterScopeGate', () => {
  let gate: OpenRouterScopeGate;

  beforeEach(() => {
    vi.mocked(axios.post).mockReset();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    gate = new OpenRouterScopeGate();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when the filter reaches a verdict', () => {
    it('admits a question about Artur', async () => {
      vi.mocked(axios.post).mockResolvedValue(verdict('ALLOW'));

      expect(await gate.isInScope('what is your tech stack?')).toBe(true);
    });

    it('turns away a request to write the visitor code', async () => {
      vi.mocked(axios.post).mockResolvedValue(verdict('BLOCK'));

      expect(await gate.isInScope('write me a sorting function')).toBe(false);
    });

    it('reads the verdict regardless of casing and padding', async () => {
      vi.mocked(axios.post).mockResolvedValue(verdict('  block\n'));

      expect(await gate.isInScope('write me a sorting function')).toBe(false);
    });

    it('reads a verdict the model wrapped in a sentence', async () => {
      vi.mocked(axios.post).mockResolvedValue(verdict('BLOCK - unrelated to Artur'));

      expect(await gate.isInScope('capital of France')).toBe(false);
    });
  });

  describe('when the filter cannot be trusted', () => {
    it('lets the question through on an unreadable verdict', async () => {
      vi.mocked(axios.post).mockResolvedValue(verdict('I am not sure about that'));

      expect(await gate.isInScope('anything')).toBe(true);
    });

    it('lets the question through on an empty completion', async () => {
      vi.mocked(axios.post).mockResolvedValue({ data: { choices: [] } });

      expect(await gate.isInScope('anything')).toBe(true);
    });

    it('lets the question through when the gate model is rate limited', async () => {
      vi.mocked(axios.post).mockRejectedValue(httpError(429));

      expect(await gate.isInScope('anything')).toBe(true);
    });

    it('lets the question through when the network fails', async () => {
      vi.mocked(axios.post).mockRejectedValue(new Error('socket hang up'));

      expect(await gate.isInScope('anything')).toBe(true);
    });

    it('lets the question through when no api key is configured', async () => {
      const keyless = new OpenRouterScopeGate('');

      expect(await keyless.isInScope('anything')).toBe(true);
      expect(vi.mocked(axios.post)).not.toHaveBeenCalled();
    });
  });

  describe('when the same question comes back', () => {
    it('reuses the verdict instead of paying for it twice', async () => {
      vi.mocked(axios.post).mockResolvedValue(verdict('BLOCK'));

      await gate.isInScope('write me a sorting function');
      await gate.isInScope('write me a sorting function');

      expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(1);
    });

    it('ignores casing and surrounding space when matching', async () => {
      vi.mocked(axios.post).mockResolvedValue(verdict('ALLOW'));

      await gate.isInScope('What is your stack?');
      await gate.isInScope('  what is your stack?  ');

      expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(1);
    });

    it('does not cache a verdict it could not read', async () => {
      vi.mocked(axios.post).mockRejectedValueOnce(new Error('socket hang up'));
      vi.mocked(axios.post).mockResolvedValue(verdict('BLOCK'));

      await gate.isInScope('write me a sorting function');
      const second = await gate.isInScope('write me a sorting function');

      expect(second).toBe(false);
      expect(vi.mocked(axios.post)).toHaveBeenCalledTimes(2);
    });
  });

  describe('what the filter is allowed to see', () => {
    it('passes the question as the only user turn', async () => {
      vi.mocked(axios.post).mockResolvedValue(verdict('ALLOW'));

      await gate.isInScope('what is your tech stack?');
      const userTurns = sentBody().messages.filter((m) => m.role === 'user');

      expect(userTurns).toEqual([{ role: 'user', content: 'what is your tech stack?' }]);
    });

    it('never hands it the portfolio system prompt', async () => {
      vi.mocked(axios.post).mockResolvedValue(verdict('ALLOW'));

      await gate.isInScope('what is your tech stack?');
      const everything = sentBody()
        .messages.map((m) => m.content)
        .join('\n');

      expect(everything).not.toContain('KNOWLEDGE GRAPH');
    });

    it('runs on the pinned filter model rather than the visitor choice', async () => {
      vi.mocked(axios.post).mockResolvedValue(verdict('ALLOW'));

      await gate.isInScope('what is your tech stack?');

      expect(sentBody().model).toBe(llmConfig.scopeGateModel);
    });

    it('switches reasoning off, or the verdict never reaches the response body', async () => {
      vi.mocked(axios.post).mockResolvedValue(verdict('ALLOW'));

      await gate.isInScope('what is your tech stack?');

      expect(sentBody().reasoning).toEqual({ enabled: false });
    });
  });
});
