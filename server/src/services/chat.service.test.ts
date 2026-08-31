import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock, type MockProxy } from 'vitest-mock-extended';
import { ChatService, HISTORY_MESSAGE_LIMIT } from './chat.service';
import type { ChatRepository } from '../repositories/chat.repository';
import type { ScopeGate } from './llm/scopeGate';
import type { LLMProvider, ChatMessage, ChatSession, VisitorFootprint } from '../types';

const OWNER = '11111111-1111-4111-8111-111111111111';
const INTRUDER = '22222222-2222-4222-8222-222222222222';
const SESSION_ID = '33333333-3333-4333-8333-333333333333';
const MODEL = 'vendor/model:free';

const visitor = (token = OWNER): VisitorFootprint => ({
  token,
  ipHash: 'a1b2c3d4e5f60718',
  browser: 'Firefox',
  os: 'Linux',
  isBot: false,
  country: 'UA',
});

const SESSION: ChatSession = {
  id: SESSION_ID,
  title: 'New Chat',
  model: MODEL,
  message_count: 0,
  created_at: '2026-01-01T00:00:00.000Z',
  last_message_at: null,
};

const request = (overrides: Partial<Parameters<ChatService['processMessage']>[0]> = {}) => ({
  visitor: visitor(),
  sessionId: SESSION_ID,
  message: 'What is your stack?',
  model: MODEL,
  ...overrides,
});

describe('ChatService', () => {
  let repository: MockProxy<ChatRepository>;
  let llm: MockProxy<LLMProvider>;
  let gate: MockProxy<ScopeGate>;
  let service: ChatService;

  beforeEach(() => {
    repository = mock<ChatRepository>();
    llm = mock<LLMProvider>();
    gate = mock<ScopeGate>();
    repository.findSession.mockResolvedValue(SESSION);
    repository.getModelContext.mockResolvedValue([]);
    gate.isInScope.mockResolvedValue(true);
    llm.chat.mockResolvedValue({ reply: 'TypeScript and Node.', modelUsed: MODEL });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    service = new ChatService(repository, llm, gate);
  });

  describe('when a visitor sends a message to their own session', () => {
    it('answers with the model reply', async () => {
      const result = await service.processMessage(request());

      expect(result.reply).toBe('TypeScript and Node.');
    });

    it('reports the model that actually answered', async () => {
      llm.chat.mockResolvedValue({ reply: 'hi', modelUsed: 'vendor/fallback:free' });

      const result = await service.processMessage(request());

      expect(result.modelUsed).toBe('vendor/fallback:free');
    });

    it('stores the question and the answer as one answered turn', async () => {
      await service.processMessage(request());

      expect(repository.recordTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: SESSION_ID,
          question: 'What is your stack?',
          answer: 'TypeScript and Node.',
          status: 'ok',
          modelUsed: MODEL,
          error: null,
        })
      );
    });

    it('times the turn', async () => {
      await service.processMessage(request());

      const turn = repository.recordTurn.mock.calls[0]?.[0];
      expect(turn?.latencyMs).toBeTypeOf('number');
      expect(turn?.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('refreshes what is known about the visitor', async () => {
      await service.processMessage(request());

      expect(repository.rememberVisitor).toHaveBeenCalledWith(
        expect.objectContaining({ token: OWNER, ipHash: 'a1b2c3d4e5f60718' })
      );
    });

    it('hands the model the conversation so far', async () => {
      const earlier: ChatMessage[] = [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi' },
      ];
      repository.getModelContext.mockResolvedValue(earlier);

      await service.processMessage(request());

      expect(llm.chat).toHaveBeenCalledWith('What is your stack?', earlier, MODEL);
    });

    it('asks the store for a bounded slice of history rather than all of it', async () => {
      await service.processMessage(request());

      expect(repository.getModelContext).toHaveBeenCalledWith(SESSION_ID, HISTORY_MESSAGE_LIMIT);
    });

    it('names the session after the opening question', async () => {
      await service.processMessage(request({ message: 'Tell me about the Kubernetes project' }));

      expect(repository.renameSession).toHaveBeenCalledWith(
        SESSION_ID,
        'Tell me about the Kubernete...'
      );
    });

    it('leaves the title alone once the conversation is under way', async () => {
      repository.findSession.mockResolvedValue({ ...SESSION, message_count: 2 });

      await service.processMessage(request());

      expect(repository.renameSession).not.toHaveBeenCalled();
    });

    it('still answers when the bookkeeping write fails', async () => {
      repository.recordTurn.mockRejectedValue(new Error('messages table is gone'));

      const result = await service.processMessage(request());

      expect(result.reply).toBe('TypeScript and Node.');
    });
  });

  describe('when a visitor targets a session they do not own', () => {
    beforeEach(() => {
      repository.findSession.mockResolvedValue(undefined);
    });

    it('refuses the message', async () => {
      await expect(
        service.processMessage(request({ visitor: visitor(INTRUDER) }))
      ).rejects.toMatchObject({ status: 404 });
    });

    it('spends no model call on it', async () => {
      await service.processMessage(request({ visitor: visitor(INTRUDER) })).catch(() => undefined);

      expect(llm.chat).not.toHaveBeenCalled();
    });

    it('writes nothing to the conversation', async () => {
      await service.processMessage(request({ visitor: visitor(INTRUDER) })).catch(() => undefined);

      expect(repository.recordTurn).not.toHaveBeenCalled();
    });

    it('refuses to read the history', async () => {
      await expect(service.getHistory(INTRUDER, SESSION_ID)).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('when the model cannot answer', () => {
    beforeEach(() => {
      llm.chat.mockRejectedValue(new Error('all models are busy'));
    });

    it('propagates the failure to the caller', async () => {
      await expect(service.processMessage(request())).rejects.toThrow('all models are busy');
    });

    it('records the failure with its reason', async () => {
      await service.processMessage(request()).catch(() => undefined);

      expect(repository.recordTurn).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'error', error: 'all models are busy' })
      );
    });
  });

  describe('when the question is not about Artur', () => {
    beforeEach(() => {
      gate.isInScope.mockResolvedValue(false);
    });

    it('answers with a redirect instead of the question', async () => {
      const result = await service.processMessage(request({ message: 'write me a quick sort' }));

      expect(result.reply).toMatch(/portfolio assistant/i);
    });

    it('answers in the language the visitor used', async () => {
      const result = await service.processMessage(
        request({ message: 'напиши функцію сортування' })
      );

      expect(result.reply).toMatch(/Артур/);
    });

    it('spends no call on the answering model', async () => {
      await service.processMessage(request({ message: 'write me a quick sort' }));

      expect(llm.chat).not.toHaveBeenCalled();
    });

    it('keeps the refused turn, marked as refused', async () => {
      await service.processMessage(request({ message: 'write me a quick sort' }));

      expect(repository.recordTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'refused',
          modelUsed: 'scope-gate',
          question: 'write me a quick sort',
        })
      );
    });
  });

  describe('when the model answers with a wall of code', () => {
    const codeDump = ['Here you go:', '```ts', ...Array(30).fill('const x = 1;'), '```'].join('\n');

    beforeEach(() => {
      llm.chat.mockResolvedValue({ reply: codeDump, modelUsed: MODEL });
    });

    it('replaces it with the redirect', async () => {
      const result = await service.processMessage(request());

      expect(result.reply).not.toContain('```');
    });

    it('stores the redirect rather than the dump', async () => {
      await service.processMessage(request());

      const turn = repository.recordTurn.mock.calls[0]?.[0];
      expect(turn?.status).toBe('refused');
      expect(turn?.answer).not.toContain('```');
    });

    it('lets a short illustrative snippet through untouched', async () => {
      const snippet = ['I did it like this:', '```ts', 'const a = 1;', '```'].join('\n');
      llm.chat.mockResolvedValue({ reply: snippet, modelUsed: MODEL });

      const result = await service.processMessage(request());

      expect(result.reply).toBe(snippet);
    });
  });

  describe('when a visitor lists their sessions', () => {
    it('sees only their own', async () => {
      repository.listSessions.mockResolvedValue([SESSION]);

      const sessions = await service.listSessions(OWNER);

      expect(repository.listSessions).toHaveBeenCalledWith(OWNER);
      expect(sessions).toEqual([SESSION]);
    });
  });

  describe('when a visitor opens a session', () => {
    beforeEach(() => {
      repository.createSession.mockResolvedValue(SESSION);
    });

    it('records who owns it, hashed rather than addressed', async () => {
      await service.createSession(visitor(), MODEL, 'New Chat');

      expect(repository.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          visitorToken: OWNER,
          ipHash: 'a1b2c3d4e5f60718',
          model: MODEL,
          title: 'New Chat',
        })
      );
    });

    it('creates the visitor before the session that references it', async () => {
      await service.createSession(visitor(), MODEL, 'New Chat');

      const remembered = repository.rememberVisitor.mock.invocationCallOrder[0];
      const created = repository.createSession.mock.invocationCallOrder[0];
      expect(remembered).toBeLessThan(created);
    });

    it('gives it an identifier the visitor did not choose', async () => {
      await service.createSession(visitor(), MODEL, 'New Chat');

      const created = repository.createSession.mock.calls[0]?.[0];
      expect(created?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-/);
    });
  });
});
