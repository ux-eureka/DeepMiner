import React, { useState } from 'react';
import { Hexagon, MessageSquare, Plus, Settings, PanelLeftClose, MoreHorizontal, Download, Trash2, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const { resetChat, loadSession, state, deleteSession } = useChatFlow();
  const { openSettings } = useAIConfig();
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
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

  // Menu Handlers
  const toggleMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenMenuId(prev => prev === id ? null : id);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这条记录吗？')) {
        deleteSession(id);
    }
    setOpenMenuId(null);
  };

  // Close menu on outside click
  React.useEffect(() => {
    const closeMenu = () => setOpenMenuId(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

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
                "group flex items-center justify-between gap-2 px-3 py-2 rounded-md text-sm cursor-pointer transition-colors relative",
                item.active
                  ? "bg-gray-200/50 text-slate-900 font-medium"
                  : "text-slate-600 hover:bg-gray-100 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                <span className="truncate">{item.title}</span>
              </div>
              
              {/* More Menu Trigger */}
              <button 
                onClick={(e) => toggleMenu(e, item.id)}
                className={cn(
                    "p-1 rounded-md hover:bg-gray-200 opacity-0 group-hover:opacity-100 transition-opacity",
                    openMenuId === item.id && "opacity-100 bg-gray-200"
                )}
                aria-label="更多操作"
              >
                <MoreHorizontal className="w-4 h-4 text-slate-500" />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {openMenuId === item.id && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 5 }}
                        className="absolute right-2 top-8 w-32 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden py-1"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            className="w-full text-left px-3 py-2 text-xs text-slate-600 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!item.isCompleted}
                            onClick={(e) => {
                                e.stopPropagation();
                                // Handle download
                                setOpenMenuId(null);
                            }}
                        >
                            <Download className="w-3 h-3" />
                            下载文档
                        </button>
                        <button
                            className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                            onClick={(e) => handleDelete(e, item.id)}
                        >
                            <Trash2 className="w-3 h-3" />
                            删除
                        </button>
                    </motion.div>
                )}
              </AnimatePresence>
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
        </div>
      </div>
    </div>
  );
};
