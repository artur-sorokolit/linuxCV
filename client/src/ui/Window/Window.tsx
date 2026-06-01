import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOS } from '@/core/os/OSContext';
import { WindowInfoContext } from '@/core/window/WindowInfoContext';
import type { WindowProps } from '@/shared/types/window';
import './Window.css';

export const Window: React.FC<WindowProps> = ({ id, children }) => {
  const { windows, closeWindow, focusWindow, toggleMinimize, toggleMaximize, isMobile } = useOS();

  const windowState = windows[id];
  if (!windowState) {
    return null;
  }
  const isVisible = windowState.isOpen && !windowState.isMinimized;
  const taskbarHeight = 40;
  const isMaximized = windowState.isMaximized && !isMobile;
  const initialX = isMobile ? 0 : Math.max(0, (window.innerWidth - 420) / 2);
  const initialY = isMobile ? 0 : Math.max(60, (window.innerHeight - 400) / 4);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key={id}
          drag={isMobile ? 'y' : !isMaximized}
          dragMomentum={false}
          dragElastic={isMobile ? { top: 0, bottom: 0.8 } : 0.5}
          dragSnapToOrigin={isMobile}
          dragConstraints={
            isMobile
              ? { top: 0, bottom: window.innerHeight }
              : {
                  left: -initialX,
                  top: 28 - initialY,
                  right: window.innerWidth - (isMobile ? window.innerWidth : 420) - initialX,
                  bottom: window.innerHeight - (isMobile ? window.innerHeight : 300) - initialY,
                }
          }
          onDragEnd={(_, info) => {
            if (isMobile && info.offset.y > 120) {
              toggleMinimize(id);
            }
          }}
          onMouseDown={() => focusWindow(id)}
          initial={isMobile ? { y: '100%' } : { scale: 0.92, opacity: 0 }}
          animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
          exit={isMobile ? { y: '100%' } : { scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            zIndex: isMobile ? 2000 : windowState.zIndex,
            position: 'fixed',
            left: isMaximized ? 0 : isMobile ? 0 : initialX,
            top: isMaximized ? 28 : isMobile ? 0 : initialY,
            width: isMaximized ? '100vw' : isMobile ? '100vw' : 'auto',
            height: isMaximized
              ? `calc(100vh - 28px - ${taskbarHeight}px)`
              : isMobile
                ? '100vh'
                : 'auto',
            maxWidth: '100vw',
            maxHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            transform: isMaximized ? 'none !important' : undefined,
          }}
          className={`liquid-glass window--${id} ${isMobile ? 'window--mobile' : 'rounded-lg'} ${isMaximized ? 'window--maximized' : ''}`}
        >
          {/* Window Header */}
          <div className="window-header">
            {isMobile ? (
              <div className="mobile-window-header">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMinimize(id);
                  }}
                  className="mobile-window-control mobile-window-control--minimize"
                  aria-label="Minimize"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <div className="mobile-window-header__drag-handle"></div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeWindow(id);
                  }}
                  className="mobile-window-control mobile-window-control--close"
                  aria-label="Close"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            ) : (
              <div className="window-controls">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMinimize(id);
                  }}
                  className="window-control window-control--minimize"
                  title="Minimize"
                ></button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMaximize(id);
                  }}
                  className={`window-control ${isMaximized ? 'window-control--restore' : 'window-control--maximize'}`}
                  title={isMaximized ? 'Restore' : 'Maximize'}
                ></button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeWindow(id);
                  }}
                  className="window-control window-control--close"
                  title="Close"
                ></button>
              </div>
            )}
          </div>

          {/* Window Content */}
          <div className="window-content custom-scrollbar">
            <WindowInfoContext.Provider value={{ isMaximized, windowId: id }}>
              {children}
            </WindowInfoContext.Provider>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
