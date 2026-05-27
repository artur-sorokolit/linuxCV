import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { AVAILABLE_MODELS, type ChatModel } from '@/core/config/chatConfig';
import type { Message, ChatSession } from './chatTypes';
import * as api from './chatApi';

type State = {
  messages: Message[];
  sessions: ChatSession[];
  currentSessionId: string | null;
  selectedModel: ChatModel;
  isLoading: boolean;
};

type Action =
  | { type: 'SET_SESSIONS'; payload: ChatSession[] }
  | { type: 'ADD_SESSION'; payload: ChatSession }
  | { type: 'SET_CURRENT_SESSION'; payload: string }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'APPEND_MESSAGE'; payload: Message }
  | { type: 'SET_MODEL'; payload: ChatModel }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: State = {
  messages: [],
  sessions: [],
  currentSessionId: null,
  selectedModel: AVAILABLE_MODELS[0],
  isLoading: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_SESSIONS':
      return { ...state, sessions: action.payload };
    case 'ADD_SESSION':
      return { ...state, sessions: [action.payload, ...state.sessions] };
    case 'SET_CURRENT_SESSION':
      return { ...state, currentSessionId: action.payload };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'APPEND_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'SET_MODEL':
      return { ...state, selectedModel: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

import { suggestions } from './suggestions';

const getRandomSuggestions = () => {
  return [...suggestions].sort(() => 0.5 - Math.random()).slice(0, 2);
};

export const useChatService = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isModelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>(getRandomSuggestions());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.isLoading]);

  useEffect(() => {
    if (state.messages.length === 0) {
      setActiveSuggestions(getRandomSuggestions());
    }
  }, [state.messages.length]);

  useEffect(() => {
    api
      .fetchSessions()
      .then((data) => dispatch({ type: 'SET_SESSIONS', payload: data }))
      .catch((e) => console.error('Failed to fetch sessions:', e));
  }, []);

  const startNewChat = useCallback(
    async (modelId?: string | React.MouseEvent) => {
      const actualModelId = typeof modelId === 'string' ? modelId : state.selectedModel.id;
      try {
        const newSession = await api.createSession(actualModelId, 'New Chat');
        dispatch({ type: 'ADD_SESSION', payload: newSession });
        dispatch({ type: 'SET_CURRENT_SESSION', payload: newSession.id });
        dispatch({ type: 'SET_MESSAGES', payload: [] });
        setHistoryOpen(false);
      } catch (e) {
        console.error('Failed to start new chat:', e);
      }
    },
    [state.selectedModel.id]
  );

  const loadSession = useCallback(
    async (sessionId: string) => {
      try {
        const history = await api.fetchSessionHistory(sessionId);
        const session = state.sessions.find((s) => s.id === sessionId);
        if (session) {
          const model = AVAILABLE_MODELS.find((m) => m.id === session.model) || AVAILABLE_MODELS[0];
          dispatch({ type: 'SET_MODEL', payload: model });
        }
        dispatch({ type: 'SET_MESSAGES', payload: history });
        dispatch({ type: 'SET_CURRENT_SESSION', payload: sessionId });
        setHistoryOpen(false);
      } catch (e) {
        console.error('Failed to load session:', e);
      }
    },
    [state.sessions]
  );

  const [input, setInput] = useState('');

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || state.isLoading) {
        return;
      }

      let sessionId = state.currentSessionId;
      if (!sessionId) {
        const newSession = await api.createSession(state.selectedModel.id, text.slice(0, 30));
        dispatch({ type: 'ADD_SESSION', payload: newSession });
        sessionId = newSession.id;
        dispatch({ type: 'SET_CURRENT_SESSION', payload: sessionId });
      }

      const userMsg = { role: 'user', content: text.trim() } as Message;
      dispatch({ type: 'APPEND_MESSAGE', payload: userMsg });
      setInput('');
      dispatch({ type: 'SET_LOADING', payload: true });

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const { reply } = await api.postMessage(
          text.trim(),
          sessionId,
          state.selectedModel.id,
          controller.signal
        );
        dispatch({
          type: 'APPEND_MESSAGE',
          payload: { role: 'assistant', content: reply || 'No response' },
        });
        const fresh = await api.fetchSessions();
        dispatch({ type: 'SET_SESSIONS', payload: fresh });
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          dispatch({
            type: 'APPEND_MESSAGE',
            payload: { role: 'assistant', content: 'Generation stopped.' },
          });
        } else {
          console.error('Chat error:', e);
          const msg = e instanceof Error ? e.message : 'Unable to connect to AI brain.';
          dispatch({
            type: 'APPEND_MESSAGE',
            payload: { role: 'assistant', content: msg },
          });
        }
      } finally {
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    },
    [state]
  );

  const setSelectedModel = useCallback((model: ChatModel) => {
    dispatch({ type: 'SET_MODEL', payload: model });
  }, []);

  return {
    messages: state.messages,
    sessions: state.sessions,
    currentSessionId: state.currentSessionId,
    selectedModel: state.selectedModel,
    isLoading: state.isLoading,
    input,
    setInput,
    isModelDropdownOpen,
    setModelDropdownOpen,
    isHistoryOpen,
    setHistoryOpen,
    messagesEndRef,
    startNewChat,
    loadSession,
    sendMessage,
    setSelectedModel,
    activeSuggestions,
    stopGeneration,
  };
};
