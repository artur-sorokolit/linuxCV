import { useState, useCallback, useEffect } from 'react';
import { OSContext } from './OSContext';

export type WindowState = {
  id: string;
  title: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  content?: React.ReactNode;
};

export const OSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [windows, setWindows] = useState<Record<string, WindowState>>({
    about: {
      id: 'about',
      title: 'About Me',
      isOpen: true,
      isMinimized: false,
      isMaximized: false,
      zIndex: 1,
    },
  });
  const [activeWindowId, setActiveWindowId] = useState<string | null>('about');
  const [maxZIndex, setMaxZIndex] = useState(1);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isAdmin, setIsAdminState] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('admin') === '1') {
      localStorage.setItem('isAdmin', 'true');
      return true;
    }
    return localStorage.getItem('isAdmin') === 'true';
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const setIsAdmin = useCallback((val: boolean) => {
    setIsAdminState(val);
    localStorage.setItem('isAdmin', val ? 'true' : 'false');
  }, []);

  const openWindow = useCallback(
    (id: string, title: string, content?: React.ReactNode) => {
      setWindows((prev) => ({
        ...prev,
        [id]: {
          id,
          title,
          isOpen: true,
          isMinimized: false,
          isMaximized: false,
          zIndex: maxZIndex + 1,
          content: content || prev[id]?.content,
        },
      }));
      setActiveWindowId(id);
      setMaxZIndex((prev) => prev + 1);
    },
    [maxZIndex]
  );

  const closeWindow = useCallback(
    (id: string) => {
      setWindows((prev) => {
        const win = prev[id];
        if (!win) {
          return prev;
        }
        return {
          ...prev,
          [id]: { ...win, isOpen: false },
        };
      });
      if (activeWindowId === id) {
        setActiveWindowId(null);
      }
    },
    [activeWindowId]
  );

  const focusWindow = useCallback(
    (id: string) => {
      setWindows((prev) => ({
        ...prev,
        [id]: { ...prev[id], zIndex: maxZIndex + 1, isMinimized: false },
      }));
      setActiveWindowId(id);
      setMaxZIndex((prev) => prev + 1);
    },
    [maxZIndex]
  );

  const toggleMinimize = useCallback(
    (id: string) => {
      setWindows((prev) => ({
        ...prev,
        [id]: { ...prev[id], isMinimized: true },
      }));
      if (activeWindowId === id) {
        setActiveWindowId(null);
      }
    },
    [activeWindowId]
  );

  const toggleMaximize = useCallback((id: string) => {
    setWindows((prev) => {
      const win = prev[id];
      if (!win) {
        return prev;
      }
      return {
        ...prev,
        [id]: { ...win, isMaximized: !win.isMaximized },
      };
    });
  }, []);

  return (
    <OSContext.Provider
      value={{
        windows,
        activeWindowId,
        isAdmin,
        setIsAdmin,
        isMobile,
        openWindow,
        closeWindow,
        toggleMinimize,
        focusWindow,
        toggleMaximize,
      }}
    >
      {children}
    </OSContext.Provider>
  );
};
