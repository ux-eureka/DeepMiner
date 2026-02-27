import React from 'react';
import { Hexagon, MessageSquare, Plus, Trash2, Settings, PanelLeftClose } from 'lucide-react';
import { motion } from 'framer-motion';
import { useChatFlow } from '../hooks/useChatFlow';
import { useAIConfig } from '../context/AIConfigContext';
import { cn } from '../utils/cn';
import styles from './Sidebar.module.css';

type SidebarProps = {
  collapsed: boolean;
  isMobile: boolean;
  mobileOpen: boolean;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
};

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  isMobile,
  mobileOpen,
  onToggleCollapsed,
  onCloseMobile,
}) => {
  const { resetChat, loadSession, state } = useChatFlow();
  const { openSettings } = useAIConfig();
  
  // Use real history from state
  const history = state.history || [];

  const handleHistoryClick = (id: string) => {
    loadSession(id);
    if (isMobile) onCloseMobile();
  };

  const handleNewChat = () => {
    resetChat();
    if (isMobile) onCloseMobile();
  };

  const handleOpenSettings = () => {
    openSettings();
    if (isMobile) onCloseMobile();
  };

  const handleClearAll = () => {
    resetChat();
    if (isMobile) onCloseMobile();
  };

  return (
    <div
      className={cn(
        styles.sidebar,
        collapsed && !isMobile && styles.sidebarCollapsed,
        isMobile && styles.sidebarMobile,
        isMobile && mobileOpen && styles.sidebarMobileOpen
      )}
      data-testid="sidebar"
      data-collapsed={collapsed ? 'true' : 'false'}
      aria-hidden={collapsed && !isMobile}
    >
      <div className={styles.sidebarInner}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-lg cursor-pointer" onClick={handleNewChat}>
            <Hexagon className="w-6 h-6 fill-slate-800 text-slate-800" />
            <span>DeepMiner</span>
          </div>
          {!isMobile && !collapsed && (
            <motion.button
              type="button"
              layoutId="sidebar-toggle"
              className={styles.toggleButton}
              aria-label="收起侧边栏"
              onClick={onToggleCollapsed}
              data-testid="sidebar-toggle"
              data-location="sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        <div className="p-4">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm text-slate-700 py-2 px-4 rounded-lg transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            新会话
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            最近记录
          </div>
          {history.length === 0 && (
            <div className="px-3 py-4 text-xs text-gray-400 text-center">暂无历史记录</div>
          )}
          {history.map((item) => (
            <div
              key={item.id}
              onClick={() => handleHistoryClick(item.id)}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors",
                item.active
                  ? "bg-gray-200/50 text-slate-900 font-medium"
                  : "text-slate-600 hover:bg-gray-100 hover:text-slate-900"
              )}
            >
              <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
              <span className="truncate">{item.title}</span>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-gray-100 space-y-1">
          <button
            onClick={handleOpenSettings}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-gray-100 rounded-md transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>系统设置</span>
          </button>
          <button
            onClick={handleClearAll}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>清空所有会话</span>
          </button>
        </div>
      </div>
    </div>
  );
};
