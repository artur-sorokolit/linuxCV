import { AnimatePresence } from 'framer-motion';
import { OSProvider } from './core/os/OSProvider';
import { useOS } from './core/os/OSContext';
import { appConfigs } from './config/appConfig';

import { TopBar } from './ui/topBar/TopBar';
import { Window } from './ui/Window/Window';
import { DesktopIcon } from './ui/DesktopIcon/DesktopIcon';
import { Taskbar } from './ui/Taskbar/Taskbar';
import './App.css';
import Banner from './ui/banner/Banner';
import Chat from '@/features/Chat/Chat';

const Desktop = () => {
  const { isMobile, windows } = useOS();

  return (
    <div className={`desktop ${isMobile ? 'desktop--mobile' : ''}`}>
      <TopBar />
      <Banner />

      {!isMobile && (
        <>
          <div className="desktop-status">
            <span className="desktop-status-dot" />
            Available for opportunities
          </div>
          <div className="desktop-hint">💡 Click on folders to explore my workspace</div>
        </>
      )}

      {/* Pinned Desktop Chat Widget (Desktop Only) */}
      {!isMobile && (
        <div className="desktop-chat-widget">
          <Chat />
        </div>
      )}

      <div className="desktop-icons">
        {appConfigs
          .filter((config) => isMobile || config.id !== 'chat')
          .map((config) => (
            <DesktopIcon key={config.id} id={config.id} title={config.title} icon={config.icon} />
          ))}
      </div>

      {appConfigs
        .filter((config) => isMobile || config.id !== 'chat')
        .map((config) => (
          <Window key={config.id} id={config.id} title={config.title}>
            {config.content}
          </Window>
        ))}

      {/* Dynamic programmatically opened windows */}
      {Object.values(windows)
        .filter((win) => !appConfigs.some((app) => app.id === win.id))
        .map((win) => (
          <Window key={win.id} id={win.id} title={win.title}>
            {win.content}
          </Window>
        ))}

      <AnimatePresence>
        {!isMobile && Object.keys(windows).length > 0 && <Taskbar />}
      </AnimatePresence>
    </div>
  );
};

function App() {
  return (
    <OSProvider>
      <Desktop />
    </OSProvider>
  );
}

export default App;
