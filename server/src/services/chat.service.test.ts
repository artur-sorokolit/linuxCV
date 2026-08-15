import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mock, type MockProxy } from 'vitest-mock-extended';
import { ChatService, HISTORY_MESSAGE_LIMIT } from './chat.service';
import type { ChatRepository } from '../repositories/chat.repository';
import type { LLMProvider, ChatMessage, ChatSession } from '../types';

const OWNER = '11111111-1111-4111-8111-111111111111';
const INTRUDER = '22222222-2222-4222-8222-222222222222';
const SESSION_ID = '33333333-3333-4333-8333-333333333333';
const MODEL = 'vendor/model:free';

const SESSION: ChatSession = {
  id: SESSION_ID,
  title: 'New Chat',
  model: MODEL,
  created_at: '2026-01-01T00:00:00.000Z',
};

const request = (overrides: Partial<Parameters<ChatService['processMessage']>[0]> = {}) => ({
  ownerToken: OWNER,
  sessionId: SESSION_ID,
  message: 'What is your stack?',
  model: MODEL,
  ip: '203.0.113.7',
  userAgent: 'Firefox',
  ...overrides,
});

describe('ChatService', () => {
  let repository: MockProxy<ChatRepository>;
  let llm: MockProxy<LLMProvider>;
  let service: ChatService;

  beforeEach(() => {
    repository = mock<ChatRepository>();
    llm = mock<LLMProvider>();
    repository.findSession.mockResolvedValue(SESSION);
    repository.getRecentHistory.mockResolvedValue([]);
    llm.chat.mockResolvedValue({ reply: 'TypeScript and Node.', modelUsed: MODEL });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    service = new ChatService(repository, llm);
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

    it('stores the question and the answer as one exchange', async () => {
      await service.processMessage(request());

      expect(repository.appendExchange).toHaveBeenCalledWith(
        SESSION_ID,
        'What is your stack?',
        'TypeScript and Node.'
      );
    });

    it('hands the model the conversation so far', async () => {
      const earlier: ChatMessage[] = [
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi' },
      ];
      repository.getRecentHistory.mockResolvedValue(earlier);

      await service.processMessage(request());

      expect(llm.chat).toHaveBeenCalledWith('What is your stack?', earlier, MODEL);
    });

    it('asks the store for a bounded slice of history rather than all of it', async () => {
      await service.processMessage(request());

      expect(repository.getRecentHistory).toHaveBeenCalledWith(SESSION_ID, HISTORY_MESSAGE_LIMIT);
    });

    it('names the session after the opening question', async () => {
      await service.processMessage(request({ message: 'Tell me about the Kubernetes project' }));

      expect(repository.renameSession).toHaveBeenCalledWith(
        SESSION_ID,
        'Tell me about the Kubernete...'
      );
    });

    it('leaves the title alone once the conversation is under way', async () => {
      repository.getRecentHistory.mockResolvedValue([
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi' },
      ]);

      await service.processMessage(request());

      expect(repository.renameSession).not.toHaveBeenCalled();
    });

    it('records the exchange for later analysis', async () => {
      await service.processMessage(request());

      expect(repository.logChatRequest).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: SESSION_ID, usedModel: MODEL, error: null })
      );
    });

    it('still answers when the analytics write fails', async () => {
      repository.logChatRequest.mockRejectedValue(new Error('logs table is gone'));

      const result = await service.processMessage(request());

      expect(result.reply).toBe('TypeScript and Node.');
    });
  });

  describe('when a visitor targets a session they do not own', () => {
    beforeEach(() => {
      repository.findSession.mockResolvedValue(undefined);
    });

    it('refuses the message', async () => {
      await expect(service.processMessage(request({ ownerToken: INTRUDER }))).rejects.toMatchObject(
        { status: 404 }
      );
    });

    it('spends no model call on it', async () => {
      await service.processMessage(request({ ownerToken: INTRUDER })).catch(() => undefined);

      expect(llm.chat).not.toHaveBeenCalled();
    });

    it('writes nothing to the conversation', async () => {
      await service.processMessage(request({ ownerToken: INTRUDER })).catch(() => undefined);

      expect(repository.appendExchange).not.toHaveBeenCalled();
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

      expect(repository.logChatRequest).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'all models are busy' })
      );
    });

    it('leaves no half written exchange behind', async () => {
      await service.processMessage(request()).catch(() => undefined);

      expect(repository.appendExchange).not.toHaveBeenCalled();
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
    it('records who owns it', async () => {
      repository.createSession.mockResolvedValue(SESSION);

      await service.createSession(OWNER, MODEL, 'New Chat');

      expect(repository.createSession).toHaveBeenCalledWith(
        expect.objectContaining({ ownerToken: OWNER, model: MODEL, title: 'New Chat' })
      );
    });

    it('gives it an identifier the visitor did not choose', async () => {
      repository.createSession.mockResolvedValue(SESSION);

      await service.createSession(OWNER, MODEL, 'New Chat');

      const created = repository.createSession.mock.calls[0]?.[0];
      expect(created?.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-/);
    });
  });
});
