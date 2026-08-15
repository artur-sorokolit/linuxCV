import React, { type Dispatch, type SetStateAction } from 'react';
import { type ChatModel } from '@/core/config/chatConfig';

/** Matches the server-side cap, so an overlong message is stopped before the round trip. */
const MAX_MESSAGE_LENGTH = 4000;

type Props = {
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  sendMessage: (msg: string) => void;
  suggestions: string[];
  isModelDropdownOpen: boolean;
  setModelDropdownOpen: Dispatch<SetStateAction<boolean>>;
  models: ChatModel[];
  selectedModel: ChatModel;
  setSelectedModel: (model: ChatModel) => void;
  isLoading: boolean;
  stopGeneration: () => void;
};

export const ChatInput: React.FC<Props> = ({
  input,
  setInput,
  handleSubmit,
  sendMessage,
  suggestions,
  isModelDropdownOpen,
  setModelDropdownOpen,
  models,
  selectedModel,
  setSelectedModel,
  isLoading,
  stopGeneration,
}) => (
  <div className="chat-panel__input-container">
    {suggestions.length > 0 && (
      <div className="chat-panel__suggestions">
        {suggestions.map((s) => (
          <button key={s} type="button" className="chat-panel__pill" onClick={() => sendMessage(s)}>
            {s}
          </button>
        ))}
      </div>
    )}

    <form className="chat-panel__input-wrapper" onSubmit={handleSubmit}>
      <input
        type="text"
        className="chat-panel__input"
        placeholder="Ask anything"
        maxLength={MAX_MESSAGE_LENGTH}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <div className="chat-panel__input-actions">
        <div className="chat-panel__left-actions">
          <div
            className="chat-panel__model-selector"
            onClick={() => setModelDropdownOpen(!isModelDropdownOpen)}
          >
            <svg
              width="17"
              height="10"
              viewBox="0 0 17 10"
              fill="none"
              style={{
                transform: isModelDropdownOpen ? 'rotate(180deg)' : 'none',
              }}
            >
              <path
                d="M1 1L8.5 8.5L16 1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span>{selectedModel.name}</span>

            {isModelDropdownOpen && (
              <div className="chat-model-dropdown">
                {models.map((model) => (
                  <div
                    key={model.id}
                    className={`chat-model-option ${selectedModel.id === model.id ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedModel(model);
                      setModelDropdownOpen(false);
                    }}
                  >
                    <div className="model-name">{model.name}</div>
                    <div className="model-provider">{model.provider}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <button
            type="button"
            className="chat-panel__stop-btn"
            onClick={stopGeneration}
            title="Stop Generation"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect width="10" height="10" x="1" y="1" rx="1.5" fill="currentColor" />
            </svg>
          </button>
        ) : (
          <button type="submit" className="chat-panel__send-btn" disabled={!input.trim()}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path
                d="M1 6.5H12M12 6.5L6.5 1M12 6.5L6.5 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    </form>
  </div>
);
