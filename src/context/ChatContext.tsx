import React, { createContext, ReactNode, useState } from 'react';
import { useDeepMinerEngine } from '../hooks/useDeepMinerEngine';
import { ChatState, ChatContextType } from '../types';

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { state: engineState, initMode, sendMessage, resetEngine, loadSession, addCustomMode, deleteSession, appendPhase } = useDeepMinerEngine();
  
  // Modal states (managed locally here as they are UI specific, not Engine specific)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Auto-open report modal when diagnostic is completed
  React.useEffect(() => {
    if (engineState.isCompleted) {
      setIsReportModalOpen(true);
    }
  }, [engineState.isCompleted]);

  // Adapter: Map Engine State to ChatState
  const contextState: ChatState = {
    currentMode: engineState.currentModeId,
    currentPhase: String(engineState.currentPhase),
    messages: engineState.messages,
    isModeLocked: engineState.hasStarted, // Use hasStarted instead of message length check
    isCompleted: engineState.isCompleted,
    isLoading: engineState.isProcessing,
    isCreateModalOpen,
    isReportModalOpen,
    history: engineState.history, // Pass history to context
    isLoadingHistory: engineState.isLoadingHistory,
    historyError: engineState.historyError,
    phases: engineState.phases,
  };

  // Mock Dispatch for compatibility with existing reducers if needed
  // But ideally components should use specific methods
  const dispatch = (action: any) => {
    switch (action.type) {
      case 'TOGGLE_CREATE_MODAL':
        setIsCreateModalOpen(action.payload);
        break;
      case 'TOGGLE_REPORT_MODAL':
        setIsReportModalOpen(action.payload);
        break;
      case 'RESET_CHAT':
        resetEngine();
        break;
      case 'SET_MODE':
        initMode(action.payload);
        break;
      // ADD_MESSAGE and NEXT_PHASE are handled by engine internally
      default:
        console.warn('Unhandled action in ChatProvider adapter:', action.type);
    }
  };

  return (
    <ChatContext.Provider value={{ 
      state: contextState, 
      dispatch,
      sendMessage,
      initMode,
      resetChat: resetEngine,
      loadSession,
      addCustomMode,
      deleteSession,
      appendPhase
    }}>
      {children}
    </ChatContext.Provider>
  );
};
