export interface ContactMessage {
  id?: number;
  name: string;
  email: string;
  message: string;
  created_at?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  model: string;
  message_count: number;
  created_at?: string;
  last_message_at?: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/** Why a turn looks the way it does: answered, redirected by the gate, or failed. */
export type TurnStatus = 'ok' | 'refused' | 'error';

/** A message as the conversation keeps it. Only 'ok' turns are ever replayed to a model. */
export interface StoredMessage extends ChatMessage {
  status: TurnStatus;
}

/** Identity the server is willing to hold: a browser token, a salted hash, coarse client facts. */
export interface VisitorFootprint {
  token: string;
  ipHash: string;
  browser: string | null;
  os: string | null;
  isBot: boolean;
  country: string | null;
}

export interface ChatModel {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
}

export interface LLMProvider {
  chat(
    message: string,
    history: ChatMessage[],
    model?: string
  ): Promise<{ reply: string; modelUsed: string }>;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}
