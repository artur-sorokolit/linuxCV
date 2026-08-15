import type { KeyboardEvent } from 'react';
import Chat from '@/features/Chat/Chat';
import { CHAT_WIDTH_KEYBOARD_STEP, useChatWidgetWidth } from '@/features/Chat/useChatWidgetWidth';

export const DesktopChatWidget = () => {
  const { width, minWidth, maxWidth, isResizing, startResize, adjustWidth, resetWidth } =
    useChatWidgetWidth();

  const handleResizeKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }
    event.preventDefault();
    adjustWidth(event.key === 'ArrowLeft' ? -CHAT_WIDTH_KEYBOARD_STEP : CHAT_WIDTH_KEYBOARD_STEP);
  };

  return (
    <div
      className={`desktop-chat-widget ${isResizing ? 'desktop-chat-widget--resizing' : ''}`}
      style={{ width }}
    >
      <Chat />
      <div
        role="separator"
        tabIndex={0}
        aria-orientation="vertical"
        aria-label="Resize chat width"
        aria-valuenow={width}
        aria-valuemin={minWidth}
        aria-valuemax={maxWidth}
        title="Drag to resize, double-click to reset"
        className="desktop-chat-widget__resize-handle"
        onPointerDown={startResize}
        onKeyDown={handleResizeKeyDown}
        onDoubleClick={resetWidth}
      />
    </div>
  );
};

export default DesktopChatWidget;
