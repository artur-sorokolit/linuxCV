import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, LLMProvider, ChatSession } from '../types';
import { OpenRouterService } from './llm/openrouter.service';
import { chatRepository, type ChatRepository } from '../repositories/chat.repository';
import { httpError } from '../utils/httpError';

/** Ten exchanges of context. Older turns add tokens and latency, not much meaning. */
export const HISTORY_MESSAGE_LIMIT = 20;
const TITLE_LENGTH = 27;

export interface ChatRequest {
  ownerToken: string;
  sessionId: string;
  message: string;
  model: string;
  ip?: string;
  userAgent?: string;
}

const toTitle = (message: string): string =>
  message.length > TITLE_LENGTH ? `${message.slice(0, TITLE_LENGTH)}...` : message;

export class ChatService {
  constructor(
    private readonly repository: ChatRepository = chatRepository,
    private readonly llmProvider: LLMProvider = new OpenRouterService()
  ) {}

  async createSession(ownerToken: string, model: string, title: string): Promise<ChatSession> {
    return this.repository.createSession({ id: uuidv4(), title, model, ownerToken });
  }

  async listSessions(ownerToken: string): Promise<ChatSession[]> {
    return this.repository.listSessions(ownerToken);
  }

  async getHistory(ownerToken: string, sessionId: string): Promise<ChatMessage[]> {
    await this.requireOwnedSession(ownerToken, sessionId);
    return this.repository.getRecentHistory(sessionId, HISTORY_MESSAGE_LIMIT);
  }

  async processMessage(request: ChatRequest): Promise<{ reply: string; modelUsed: string }> {
    await this.requireOwnedSession(request.ownerToken, request.sessionId);
    const history = await this.repository.getRecentHistory(
      request.sessionId,
      HISTORY_MESSAGE_LIMIT
    );

    try {
      const { reply, modelUsed } = await this.llmProvider.chat(
        request.message,
        history,
        request.model
      );

      await this.repository.appendExchange(request.sessionId, request.message, reply);
      if (history.length === 0) {
        await this.repository.renameSession(request.sessionId, toTitle(request.message));
      }

      await this.log(request, { reply, usedModel: modelUsed, error: null });
      return { reply, modelUsed };
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      await this.log(request, { reply: null, usedModel: request.model, error: reason });
      throw error;
    }
  }

  private async requireOwnedSession(ownerToken: string, sessionId: string): Promise<void> {
    const session = await this.repository.findSession(sessionId, ownerToken);
    if (!session) {
      throw httpError(404, 'SESSION_NOT_FOUND', 'Chat session not found');
    }
  }

  /** Analytics must never sink a reply the visitor is already waiting on. */
  private async log(
    request: ChatRequest,
    outcome: { reply: string | null; usedModel: string; error: string | null }
  ): Promise<void> {
    try {
      await this.repository.logChatRequest({
        sessionId: request.sessionId,
        ip: request.ip ?? null,
        userAgent: request.userAgent ?? null,
        model: request.model,
        usedModel: outcome.usedModel,
        message: request.message,
        reply: outcome.reply,
        error: outcome.error,
      });
    } catch (logError) {
      console.error('🔴 Failed to write to chat_logs:', logError);
    }
  }
}

export const chatService = new ChatService();
