import './Chat.css';
import { useChatService } from './useChatService';
import { ChatMessages } from './components/ChatMessages';
import { ChatInput } from './components/ChatInput';
import { ChatHistory } from './components/ChatHistory';
export type { Message, ChatSession } from './chatTypes';

export type ApiError = {
  message: string;
  code?: string;
  details?: unknown;
};

export const Chat = () => {
  const {
    messages,
    models,
    selectedModel,
    isLoading,
    input,
    setInput,
    isModelDropdownOpen,
    setModelDropdownOpen,
    messagesEndRef,
    startNewChat,
    sendMessage,
    setSelectedModel,
    activeSuggestions,
    stopGeneration,
    sessions,
    currentSessionId,
    loadSession,
    isHistoryOpen,
    setHistoryOpen,
  } = useChatService();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="chat-container">
      <div className="chat-panel">
        <div className="chat-panel__header">
          <span className="chat-panel__header-title">AI Assistant</span>
          <div className="chat-panel__header-actions">
            <button
              type="button"
              className={`chat-panel__new-chat-btn ${isHistoryOpen ? 'active' : ''}`}
              onClick={() => setHistoryOpen(!isHistoryOpen)}
              title="Previous chats"
              aria-expanded={isHistoryOpen}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 3v5h5" />
                <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
                <path d="M12 7v5l4 2" />
              </svg>
            </button>
            <button
              type="button"
              className="chat-panel__new-chat-btn"
              onClick={startNewChat}
              title="New Chat"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
          </div>
        </div>
        <div className="chat-panel__body">
          <div className="chat-panel__messages">
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              messagesEndRef={messagesEndRef}
            />
          </div>
          {isHistoryOpen && (
            <ChatHistory
              sessions={sessions}
              currentSessionId={currentSessionId}
              loadSession={loadSession}
            />
          )}
        </div>
        <ChatInput
          input={input}
          setInput={setInput}
          handleSubmit={handleSubmit}
          sendMessage={sendMessage}
          suggestions={activeSuggestions}
          isModelDropdownOpen={isModelDropdownOpen}
          setModelDropdownOpen={setModelDropdownOpen}
          models={models}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isLoading={isLoading}
          stopGeneration={stopGeneration}
        />
      </div>
    </div>
  );
};

export default Chat;
