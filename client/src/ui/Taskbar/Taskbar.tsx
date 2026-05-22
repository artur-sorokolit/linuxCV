import { motion } from 'framer-motion';
import { useOS } from '@/core/os/OSContext';
import { appConfigs } from '@/config/appConfig';
import './Taskbar.css';

export const Taskbar = () => {
  const { windows, activeWindowId, focusWindow, toggleMinimize } = useOS();

  const openWindows = Object.values(windows).filter((w) => w.isOpen);

  const getIcon = (id: string) => {
    const appId = id.startsWith('project-') ? 'projects' : id;
    const config = appConfigs.find((c) => c.id === appId);
    return config?.icon ?? '';
  };

  const handleClick = (id: string) => {
    if (activeWindowId === id) {
      toggleMinimize(id);
    } else {
      focusWindow(id);
    }
  };

  return (
    <motion.div
      className="taskbar"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <div className="taskbar__items">
        {openWindows.map((win) => (
          <button
            key={win.id}
            className={`taskbar__item ${activeWindowId === win.id && !win.isMinimized ? 'taskbar__item--active' : ''}`}
            onClick={() => handleClick(win.id)}
            title={win.title}
          >
            <img src={getIcon(win.id)} alt="" className="taskbar__item-icon" />
            <span className="taskbar__item-label">{win.title}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};
