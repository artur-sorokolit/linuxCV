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
  created_at?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMResponse {
  reply: string;
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
