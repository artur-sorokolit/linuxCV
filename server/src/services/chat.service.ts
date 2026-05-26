import { getDb } from '../db';
import { ChatMessage, LLMProvider, ChatSession } from '../types';
import { OpenRouterService } from './llm/openrouter.service';
import { v4 as uuidv4 } from 'uuid';

export class ChatService {
  private llmProvider: LLMProvider;

  constructor() {
    this.llmProvider = new OpenRouterService();
  }

  async createSession(model: string, title?: string): Promise<ChatSession> {
    const db = await getDb();
    const session: ChatSession = {
      id: uuidv4(),
      title: title || 'New Chat',
      model: model,
    };

    await db.run('INSERT INTO chat_sessions (id, title, model) VALUES (?, ?, ?)', [
      session.id,
      session.title,
      session.model,
    ]);

    return session;
  }

  async getSessions(): Promise<ChatSession[]> {
    const db = await getDb();
    return await db.all('SELECT * FROM chat_sessions ORDER BY created_at DESC');
  }

  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    const db = await getDb();
    const rows = await db.all(
      'SELECT role, content FROM chat_history WHERE session_id = ? ORDER BY created_at ASC',
      [sessionId]
    );
    return rows.map((row: { role: 'user' | 'assistant' | 'system'; content: string }) => ({
      role: row.role,
      content: row.content,
    }));
  }

  async processMessage(message: string, sessionId: string, model: string) {
    const db = await getDb();

    // Fetch existing history for this session
    const history = await this.getHistory(sessionId);

    // Get AI response
    const reply = await this.llmProvider.chat(message, history, model);

    // Persist user message
    await db.run('INSERT INTO chat_history (session_id, role, content) VALUES (?, ?, ?)', [
      sessionId,
      'user',
      message,
    ]);

    // Persist assistant response
    await db.run('INSERT INTO chat_history (session_id, role, content) VALUES (?, ?, ?)', [
      sessionId,
      'assistant',
      reply,
    ]);

    // Optionally update session title if it's the first message
    if (history.length === 0) {
      const title = message.slice(0, 30) + (message.length > 30 ? '...' : '');
      await db.run('UPDATE chat_sessions SET title = ? WHERE id = ?', [title, sessionId]);
    }

    return reply;
  }
}

export const chatService = new ChatService();
