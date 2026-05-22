import { createContext, useContext } from 'react';
import type { WindowState } from './OSProvider';

export type OSContextType = {
  windows: Record<string, WindowState>;
  activeWindowId: string | null;
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  isMobile: boolean;
  openWindow: (id: string, title: string, content?: React.ReactNode) => void;
  closeWindow: (id: string) => void;
  toggleMinimize: (id: string) => void;
  focusWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
};

export const OSContext = createContext<OSContextType | undefined>(undefined);

export const useOS = () => {
  const context = useContext(OSContext);
  if (!context) {
    throw new Error('useOS must be used within OSProvider');
  }
  return context;
};
