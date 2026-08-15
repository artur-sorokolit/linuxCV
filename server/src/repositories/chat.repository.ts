import { getDb } from '../db';
import { ChatMessage, ChatSession } from '../types';

export interface NewSession {
  id: string;
  title: string;
  model: string;
  ownerToken: string;
}

export interface ChatLogEntry {
  sessionId: string;
  ip: string | null;
  userAgent: string | null;
  model: string;
  usedModel: string;
  message: string;
  reply: string | null;
  error: string | null;
}

export interface ChatRepository {
  createSession(session: NewSession): Promise<ChatSession>;
  listSessions(ownerToken: string): Promise<ChatSession[]>;
  findSession(sessionId: string, ownerToken: string): Promise<ChatSession | undefined>;
  getRecentHistory(sessionId: string, limit: number): Promise<ChatMessage[]>;
  appendExchange(sessionId: string, question: string, answer: string): Promise<void>;
  renameSession(sessionId: string, title: string): Promise<void>;
  logChatRequest(entry: ChatLogEntry): Promise<void>;
  purgeLogsOlderThan(days: number): Promise<number>;
}

type SessionRow = Pick<ChatSession, 'id' | 'title' | 'model' | 'created_at'>;
type HistoryRow = { role: ChatMessage['role']; content: string };

export class PostgresChatRepository implements ChatRepository {
  async createSession(session: NewSession): Promise<ChatSession> {
    const db = await getDb();
    const created = await db.get<SessionRow>(
      `INSERT INTO chat_sessions (id, title, model, owner_token) VALUES ($1, $2, $3, $4)
       RETURNING id, title, model, created_at`,
      [session.id, session.title, session.model, session.ownerToken]
    );
    if (!created) {
      throw new Error('Failed to create chat session');
    }
    return created;
  }

  async listSessions(ownerToken: string): Promise<ChatSession[]> {
    const db = await getDb();
    return db.all<SessionRow>(
      `SELECT id, title, model, created_at FROM chat_sessions
       WHERE owner_token = $1 ORDER BY created_at DESC LIMIT 50`,
      [ownerToken]
    );
  }

  async findSession(sessionId: string, ownerToken: string): Promise<ChatSession | undefined> {
    const db = await getDb();
    return db.get<SessionRow>(
      `SELECT id, title, model, created_at FROM chat_sessions
       WHERE id = $1 AND owner_token = $2`,
      [sessionId, ownerToken]
    );
  }

  /** Newest messages first in SQL so the index does the work, returned oldest first. */
  async getRecentHistory(sessionId: string, limit: number): Promise<ChatMessage[]> {
    const db = await getDb();
    const rows = await db.all<HistoryRow>(
      `SELECT role, content FROM chat_history
       WHERE session_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2`,
      [sessionId, limit]
    );
    return rows.reverse().map((row) => ({ role: row.role, content: row.content }));
  }

  /** One transaction, so a failure never leaves a question without its answer. */
  async appendExchange(sessionId: string, question: string, answer: string): Promise<void> {
    const db = await getDb();
    await db.transaction(async (tx) => {
      await tx.run(
        `INSERT INTO chat_history (session_id, role, content)
         VALUES ($1, 'user', $2), ($1, 'assistant', $3)`,
        [sessionId, question, answer]
      );
    });
  }

  async renameSession(sessionId: string, title: string): Promise<void> {
    const db = await getDb();
    await db.run('UPDATE chat_sessions SET title = $1 WHERE id = $2', [title, sessionId]);
  }

  async logChatRequest(entry: ChatLogEntry): Promise<void> {
    const db = await getDb();
    await db.run(
      `INSERT INTO chat_logs (session_id, ip, user_agent, model, used_model, message, reply, error)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entry.sessionId,
        entry.ip,
        entry.userAgent,
        entry.model,
        entry.usedModel,
        entry.message,
        entry.reply,
        entry.error,
      ]
    );
  }

  async purgeLogsOlderThan(days: number): Promise<number> {
    const db = await getDb();
    const rows = await db.all<{ id: number }>(
      `DELETE FROM chat_logs WHERE created_at < NOW() - ($1 || ' days')::interval RETURNING id`,
      [String(days)]
    );
    return rows.length;
  }
}

export const chatRepository = new PostgresChatRepository();
