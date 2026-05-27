import { API_BASE_URL } from '@/core/config/api';
import type { ApiError, ChatSession, Message } from './Chat';

async function request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
  const resp = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...init,
  });

  const data = await resp.json();

  if (!resp.ok) {
    const apiErr: ApiError = data.error ?? { message: 'Server error' };
    throw new Error(apiErr.message);
  }
  return data as T;
}

export const fetchSessions = async (): Promise<ChatSession[]> => {
  return request<ChatSession[]>('/api/chat/sessions');
};

export const createSession = async (model: string, title: string): Promise<ChatSession> => {
  return request<ChatSession>('/api/chat/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, title }),
  });
};

export const fetchSessionHistory = async (sessionId: string): Promise<Message[]> => {
  return request<Message[]>(`/api/chat/sessions/${sessionId}/history`);
};

/* ------------------------------------------------------------------ */
/* Messaging */
export const postMessage = async (
  text: string,
  sessionId: string,
  model: string,
  signal?: AbortSignal
): Promise<{ reply: string }> => {
  return request<{ reply: string }>('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: text, sessionId, model }),
    signal,
  });
};
