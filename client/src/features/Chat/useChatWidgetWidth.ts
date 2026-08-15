import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

const WIDTH_STORAGE_KEY = 'linuxcv:chat-widget-width';
const DEFAULT_CHAT_WIDTH = 460;
const MIN_CHAT_WIDTH = 320;
const MAX_CHAT_WIDTH = 960;
const VIEWPORT_RESERVE = 160;
const RESIZE_BODY_CLASS = 'chat-resize-active';

export const CHAT_WIDTH_KEYBOARD_STEP = 24;

type ResizeOrigin = {
  pointerX: number;
  width: number;
};

export type ChatWidgetWidth = {
  width: number;
  minWidth: number;
  maxWidth: number;
  isResizing: boolean;
  startResize: (event: ReactPointerEvent<HTMLElement>) => void;
  adjustWidth: (delta: number) => void;
  resetWidth: () => void;
};

const getMaxWidth = (viewportWidth: number): number =>
  Math.max(MIN_CHAT_WIDTH, Math.min(MAX_CHAT_WIDTH, viewportWidth - VIEWPORT_RESERVE));

const clampWidth = (width: number, viewportWidth: number): number =>
  Math.min(Math.max(Math.round(width), MIN_CHAT_WIDTH), getMaxWidth(viewportWidth));

const readStoredWidth = (): number => {
  try {
    const storedWidth = Number.parseInt(window.localStorage.getItem(WIDTH_STORAGE_KEY) ?? '', 10);
    return Number.isFinite(storedWidth) ? storedWidth : DEFAULT_CHAT_WIDTH;
  } catch {
    return DEFAULT_CHAT_WIDTH;
  }
};

const writeStoredWidth = (width: number): void => {
  try {
    window.localStorage.setItem(WIDTH_STORAGE_KEY, String(width));
  } catch {
    return;
  }
};

export const useChatWidgetWidth = (): ChatWidgetWidth => {
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const [preferredWidth, setPreferredWidth] = useState(readStoredWidth);
  const [isResizing, setIsResizing] = useState(false);
  const resizeOriginRef = useRef<ResizeOrigin | null>(null);

  const width = clampWidth(preferredWidth, viewportWidth);

  const setClampedWidth = useCallback((nextWidth: number) => {
    setPreferredWidth(clampWidth(nextWidth, window.innerWidth));
  }, []);

  useEffect(() => {
    const syncViewportWidth = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', syncViewportWidth);
    return () => window.removeEventListener('resize', syncViewportWidth);
  }, []);

  useEffect(() => {
    if (isResizing) {
      return;
    }
    writeStoredWidth(preferredWidth);
  }, [isResizing, preferredWidth]);

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const applyPointerWidth = (event: PointerEvent) => {
      const resizeOrigin = resizeOriginRef.current;
      if (!resizeOrigin) {
        return;
      }
      setClampedWidth(resizeOrigin.width + event.clientX - resizeOrigin.pointerX);
    };

    const stopResize = () => {
      resizeOriginRef.current = null;
      setIsResizing(false);
    };

    document.body.classList.add(RESIZE_BODY_CLASS);
    window.addEventListener('pointermove', applyPointerWidth);
    window.addEventListener('pointerup', stopResize);
    window.addEventListener('pointercancel', stopResize);

    return () => {
      document.body.classList.remove(RESIZE_BODY_CLASS);
      window.removeEventListener('pointermove', applyPointerWidth);
      window.removeEventListener('pointerup', stopResize);
      window.removeEventListener('pointercancel', stopResize);
    };
  }, [isResizing, setClampedWidth]);

  const startResize = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) {
        return;
      }
      event.preventDefault();
      resizeOriginRef.current = { pointerX: event.clientX, width };
      setIsResizing(true);
    },
    [width]
  );

  const adjustWidth = useCallback(
    (delta: number) => {
      setClampedWidth(width + delta);
    },
    [setClampedWidth, width]
  );

  const resetWidth = useCallback(() => {
    setClampedWidth(DEFAULT_CHAT_WIDTH);
  }, [setClampedWidth]);

  return {
    width,
    minWidth: MIN_CHAT_WIDTH,
    maxWidth: getMaxWidth(viewportWidth),
    isResizing,
    startResize,
    adjustWidth,
    resetWidth,
  };
};
