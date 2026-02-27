import React, { useEffect, useState } from 'react';
import { LayoutGroup, motion } from 'framer-motion';
import { PanelLeftOpen } from 'lucide-react';
import { ChatProvider } from './context/ChatContext';
import { AIConfigProvider } from './context/AIConfigContext';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { FloatingStepper } from './components/FloatingStepper';
import { Modals } from './components/Modals';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useMediaQuery } from './hooks/useMediaQuery';
import sidebarStyles from './components/Sidebar.module.css';

const App: React.FC = () => {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isWide = useMediaQuery('(min-width: 1200px)');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
      setMobileSidebarOpen(false);
      return;
    }
    if (isWide) {
      setSidebarCollapsed(false);
      setMobileSidebarOpen(false);
    }
  }, [isMobile, isWide]);

  useEffect(() => {
    if (!isMobile) return;
    document.body.style.overflow = mobileSidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, mobileSidebarOpen]);

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen(v => !v);
      return;
    }
    setSidebarCollapsed(v => !v);
  };

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  return (
    <ErrorBoundary>
      <AIConfigProvider>
        <ChatProvider>
          <LayoutGroup>
            {isMobile && (
              <div
                className={`${sidebarStyles.overlay} ${mobileSidebarOpen ? sidebarStyles.overlayOpen : ''}`}
                onClick={closeMobileSidebar}
                aria-hidden={!mobileSidebarOpen}
                data-testid="sidebar-overlay"
              />
            )}

            {(sidebarCollapsed || isMobile) && (
              <motion.button
                type="button"
                layoutId="sidebar-toggle"
                className={`${sidebarStyles.toggleButton} ${sidebarStyles.toggleTopLeft}`}
                aria-label={isMobile ? '打开侧边栏' : '展开侧边栏'}
                onClick={toggleSidebar}
                data-testid="sidebar-toggle"
                data-location="top-left"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </motion.button>
            )}

            <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-800 font-sans">
              <Sidebar
                collapsed={sidebarCollapsed}
                isMobile={isMobile}
                mobileOpen={mobileSidebarOpen}
                onToggleCollapsed={toggleSidebar}
                onCloseMobile={closeMobileSidebar}
              />
              <ChatArea />
              <FloatingStepper />
              <Modals />
            </div>
          </LayoutGroup>
        </ChatProvider>
      </AIConfigProvider>
    </ErrorBoundary>
  );
};

export default App;
