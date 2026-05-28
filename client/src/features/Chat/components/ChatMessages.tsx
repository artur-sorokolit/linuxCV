import React, { type RefObject } from 'react';
import type { Message } from '@/features/Chat/chatTypes';
import aiIcon from '@/shared/assets/icons/chat.svg';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  messages: Message[];
  isLoading: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
};

export const ChatMessages: React.FC<Props> = ({ messages, isLoading, messagesEndRef }) => (
  <>
    {messages.length === 0 && (
      <div className="chat-panel__empty">
        <span className="chat-panel__empty-title">Ask me anything</span>
        <span className="chat-panel__empty-sub">
          I&apos;m an AI assistant trained on Artur&apos;s portfolio
        </span>
      </div>
    )}
    {messages.map((msg, i) => (
      <div key={i} className={`chat-msg-row chat-msg-row--${msg.role}`}>
        {msg.role === 'assistant' && (
          <div className="chat-msg__avatar">
            <img src={aiIcon} alt="AI" />
          </div>
        )}
        <div className={`chat-msg chat-msg--${msg.role}`}>
          <div className="chat-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    ))}
    {isLoading && (
      <div className="chat-msg-row chat-msg-row--assistant">
        <div className="chat-msg__avatar">
          <img src={aiIcon} alt="AI" />
        </div>
        <div className="chat-msg chat-msg--assistant chat-msg--loading">
          <div className="typing-loader">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    )}
    <div ref={messagesEndRef} />
  </>
);
