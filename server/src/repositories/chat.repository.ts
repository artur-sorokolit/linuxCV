import { getDb } from '../db';
import { ChatMessage, ChatSession, StoredMessage, TurnStatus, VisitorFootprint } from '../types';

export interface NewSession {
  id: string;
  title: string;
  model: string;
  visitorToken: string;
  ipHash: string;
}

/** One question and its answer, plus how the answer came about. */
export interface ChatTurn {
  sessionId: string;
  question: string;
  answer: string;
  status: TurnStatus;
  model: string;
  modelUsed: string;
  error: string | null;
  latencyMs: number | null;
}

export interface ChatRepository {
  rememberVisitor(footprint: VisitorFootprint): Promise<void>;
  createSession(session: NewSession): Promise<ChatSession>;
  listSessions(visitorToken: string): Promise<ChatSession[]>;
  findSession(sessionId: string, visitorToken: string): Promise<ChatSession | undefined>;
  getConversation(sessionId: string, limit: number): Promise<StoredMessage[]>;
  getModelContext(sessionId: string, limit: number): Promise<ChatMessage[]>;
  recordTurn(turn: ChatTurn): Promise<void>;
  renameSession(sessionId: string, title: string): Promise<void>;
  purgeConversationsOlderThan(days: number): Promise<number>;
}

const SESSION_COLUMNS = 'id, title, model, message_count, created_at, last_message_at';

type SessionRow = ChatSession;
type MessageRow = { role: StoredMessage['role']; content: string; status: TurnStatus };

export class PostgresChatRepository implements ChatRepository {
  /** Upserted on every request, so last_seen and a changed network stay current. */
  async rememberVisitor(footprint: VisitorFootprint): Promise<void> {
    const db = await getDb();
    await db.run(
      `INSERT INTO visitors (token, ip_hash, ua_browser, ua_os, is_bot, country)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (token) DO UPDATE SET
         ip_hash    = EXCLUDED.ip_hash,
         ua_browser = COALESCE(EXCLUDED.ua_browser, visitors.ua_browser),
         ua_os      = COALESCE(EXCLUDED.ua_os, visitors.ua_os),
         is_bot     = EXCLUDED.is_bot,
         country    = COALESCE(EXCLUDED.country, visitors.country),
         last_seen  = NOW()`,
      [
        footprint.token,
        footprint.ipHash,
        footprint.browser,
        footprint.os,
        footprint.isBot,
        footprint.country,
      ]
    );
  }

  async createSession(session: NewSession): Promise<ChatSession> {
    const db = await getDb();
    const created = await db.get<SessionRow>(
      `INSERT INTO chat_sessions (id, title, model, visitor_token, ip_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${SESSION_COLUMNS}`,
      [session.id, session.title, session.model, session.visitorToken, session.ipHash]
    );
    if (!created) {
      throw new Error('Failed to create chat session');
    }
    return created;
  }

  /** Most recently active first, which is not the same as most recently started. */
  async listSessions(visitorToken: string): Promise<ChatSession[]> {
    const db = await getDb();
    return db.all<SessionRow>(
      `SELECT ${SESSION_COLUMNS} FROM chat_sessions
       WHERE visitor_token = $1
       ORDER BY COALESCE(last_message_at, created_at) DESC LIMIT 50`,
      [visitorToken]
    );
  }

  async findSession(sessionId: string, visitorToken: string): Promise<ChatSession | undefined> {
    const db = await getDb();
    return db.get<SessionRow>(
      `SELECT ${SESSION_COLUMNS} FROM chat_sessions WHERE id = $1 AND visitor_token = $2`,
      [sessionId, visitorToken]
    );
  }

  /** Everything the visitor saw, refusals included. Newest in SQL, returned oldest first. */
  async getConversation(sessionId: string, limit: number): Promise<StoredMessage[]> {
    const db = await getDb();
    const rows = await db.all<MessageRow>(
      `SELECT role, content, status FROM chat_messages
       WHERE session_id = $1 ORDER BY seq DESC LIMIT $2`,
      [sessionId, limit]
    );
    return rows.reverse();
  }

  /** Answered turns only: a refusal or an error must never prime the next reply. */
  async getModelContext(sessionId: string, limit: number): Promise<ChatMessage[]> {
    const db = await getDb();
    const rows = await db.all<Pick<MessageRow, 'role' | 'content'>>(
      `SELECT role, content FROM chat_messages
       WHERE session_id = $1 AND status = 'ok' ORDER BY seq DESC LIMIT $2`,
      [sessionId, limit]
    );
    return rows.reverse().map((row) => ({ role: row.role, content: row.content }));
  }

  /** One transaction, so a failure never leaves a question without its answer. */
  async recordTurn(turn: ChatTurn): Promise<void> {
    const db = await getDb();
    await db.transaction(async (tx) => {
      // Locking the session stops two in-flight turns from claiming the same seq.
      await tx.run('SELECT id FROM chat_sessions WHERE id = $1 FOR UPDATE', [turn.sessionId]);
      const next = await tx.get<{ seq: number }>(
        'SELECT COALESCE(MAX(seq), 0) + 1 AS seq FROM chat_messages WHERE session_id = $1',
        [turn.sessionId]
      );
      const seq = next?.seq ?? 1;

      await tx.run(
        `INSERT INTO chat_messages
           (session_id, seq, role, content, status, model, model_used, error, latency_ms)
         VALUES
           ($1, $2, 'user', $3, $4, $5, NULL, NULL, NULL),
           ($1, $6, 'assistant', $7, $4, $5, $8, $9, $10)`,
        [
          turn.sessionId,
          seq,
          turn.question,
          turn.status,
          turn.model,
          seq + 1,
          turn.answer,
          turn.modelUsed,
          turn.error,
          turn.latencyMs,
        ]
      );

      await tx.run(
        `UPDATE chat_sessions
         SET message_count = message_count + 2, last_message_at = NOW()
         WHERE id = $1`,
        [turn.sessionId]
      );
    });
  }

  async renameSession(sessionId: string, title: string): Promise<void> {
    const db = await getDb();
    await db.run('UPDATE chat_sessions SET title = $1 WHERE id = $2', [title, sessionId]);
  }

  /** Messages go with their session by cascade, and a visitor with nothing left goes too. */
  async purgeConversationsOlderThan(days: number): Promise<number> {
    const db = await getDb();
    const removed = await db.all<{ id: string }>(
      `DELETE FROM chat_sessions
       WHERE COALESCE(last_message_at, created_at) < NOW() - ($1 || ' days')::interval
       RETURNING id`,
      [String(days)]
    );
    await db.run(
      `DELETE FROM visitors v
       WHERE NOT EXISTS (SELECT 1 FROM chat_sessions s WHERE s.visitor_token = v.token)`
    );
    return removed.length;
  }
}

export const chatRepository = new PostgresChatRepository();
