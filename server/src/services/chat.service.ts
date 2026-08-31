import { v4 as uuidv4 } from 'uuid';
import { ChatSession, StoredMessage, TurnStatus, VisitorFootprint } from '../types';
import { LLMProvider } from '../types';
import { OpenRouterService } from './llm/openrouter.service';
import { scopeGate as defaultScopeGate, type ScopeGate } from './llm/scopeGate';
import { isCodeDump } from './llm/replyFilter';
import { buildRefusal } from './refusal';
import { chatRepository, type ChatRepository } from '../repositories/chat.repository';
import { httpError } from '../utils/httpError';

/** Ten exchanges of context. Older turns add tokens and latency, not much meaning. */
export const HISTORY_MESSAGE_LIMIT = 20;
const TITLE_LENGTH = 27;
const SCOPE_GATE_MODEL = 'scope-gate';

export interface ChatRequest {
  visitor: VisitorFootprint;
  sessionId: string;
  message: string;
  model: string;
}

interface TurnOutcome {
  answer: string;
  status: TurnStatus;
  modelUsed: string;
  error: string | null;
  startedAt: number;
}

const toTitle = (message: string): string =>
  message.length > TITLE_LENGTH ? `${message.slice(0, TITLE_LENGTH)}...` : message;

export class ChatService {
  constructor(
    private readonly repository: ChatRepository = chatRepository,
    private readonly llmProvider: LLMProvider = new OpenRouterService(),
    private readonly scopeGate: ScopeGate = defaultScopeGate
  ) {}

  async createSession(
    visitor: VisitorFootprint,
    model: string,
    title: string
  ): Promise<ChatSession> {
    // The visitor row has to exist before a session can point at it.
    await this.repository.rememberVisitor(visitor);
    return this.repository.createSession({
      id: uuidv4(),
      title,
      model,
      visitorToken: visitor.token,
      ipHash: visitor.ipHash,
    });
  }

  async listSessions(visitorToken: string): Promise<ChatSession[]> {
    return this.repository.listSessions(visitorToken);
  }

  async getHistory(visitorToken: string, sessionId: string): Promise<StoredMessage[]> {
    await this.requireOwnedSession(visitorToken, sessionId);
    return this.repository.getConversation(sessionId, HISTORY_MESSAGE_LIMIT);
  }

  async processMessage(request: ChatRequest): Promise<{ reply: string; modelUsed: string }> {
    const session = await this.requireOwnedSession(request.visitor.token, request.sessionId);
    const startedAt = Date.now();

    if (!(await this.scopeGate.isInScope(request.message))) {
      return this.redirect(request, session, SCOPE_GATE_MODEL, startedAt);
    }

    const context = await this.repository.getModelContext(request.sessionId, HISTORY_MESSAGE_LIMIT);

    try {
      const { reply, modelUsed } = await this.llmProvider.chat(
        request.message,
        context,
        request.model
      );

      // A tutorial-sized listing means the model drifted past what this chat is for.
      if (isCodeDump(reply)) {
        return this.redirect(request, session, modelUsed, startedAt);
      }

      await this.record(request, session, {
        answer: reply,
        status: 'ok',
        modelUsed,
        error: null,
        startedAt,
      });
      return { reply, modelUsed };
    } catch (error: unknown) {
      const reason = error instanceof Error ? error.message : String(error);
      await this.record(request, session, {
        answer: reason,
        status: 'error',
        modelUsed: request.model,
        error: reason,
        startedAt,
      });
      throw error;
    }
  }

  /**
   * An off-topic turn is kept, so the conversation reads whole and the filtering can
   * be reviewed. Its status keeps it out of every context handed to a model.
   */
  private async redirect(
    request: ChatRequest,
    session: ChatSession,
    usedModel: string,
    startedAt: number
  ): Promise<{ reply: string; modelUsed: string }> {
    const reply = buildRefusal(request.message);
    await this.record(request, session, {
      answer: reply,
      status: 'refused',
      modelUsed: usedModel,
      error: null,
      startedAt,
    });
    return { reply, modelUsed: usedModel };
  }

  private async requireOwnedSession(visitorToken: string, sessionId: string): Promise<ChatSession> {
    const session = await this.repository.findSession(sessionId, visitorToken);
    if (!session) {
      throw httpError(404, 'SESSION_NOT_FOUND', 'Chat session not found');
    }
    return session;
  }

  /** A bookkeeping failure must never sink a reply the visitor is already waiting on. */
  private async record(
    request: ChatRequest,
    session: ChatSession,
    outcome: TurnOutcome
  ): Promise<void> {
    try {
      await this.repository.rememberVisitor(request.visitor);
      await this.repository.recordTurn({
        sessionId: request.sessionId,
        question: request.message,
        answer: outcome.answer,
        status: outcome.status,
        model: request.model,
        modelUsed: outcome.modelUsed,
        error: outcome.error,
        latencyMs: Date.now() - outcome.startedAt,
      });

      // The client sends a provisional title, the first question replaces it.
      if (session.message_count === 0) {
        await this.repository.renameSession(request.sessionId, toTitle(request.message));
      }
    } catch (writeError) {
      console.error('🔴 Failed to record the turn:', writeError);
    }
  }
}

export const chatService = new ChatService();
