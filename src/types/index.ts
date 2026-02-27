export interface PhaseData {
  title: string;
  questions?: string[];
}

export interface Message {
  id: string;
  type: 'system' | 'user' | 'system_warning';
  content: string;
  phase?: string | number;
  timestamp: number;
  data?: PhaseData;
}

export interface ChatHistoryItem {
    id: string;
    modeId: string;
    title: string;
    timestamp: number;
    active: boolean;
    messages: Message[];
    globalContext: Record<string, string>;
    currentPhase: number;
    isCompleted: boolean;
}

export interface ChatState {
  currentMode: string | null;
  currentPhase: string;
  messages: Message[];
  isModeLocked: boolean;
  isCompleted: boolean;
  isLoading: boolean;
  isCreateModalOpen: boolean;
  isReportModalOpen: boolean;
  history?: ChatHistoryItem[]; // Added history
  isLoadingHistory?: boolean;
  historyError?: string | null;
}

export interface PhaseProgress {
  phase: string;
  title: string;
  isCompleted: boolean;
  isActive: boolean;
}

export interface ChatContextType {
  state: ChatState;
  dispatch: (action: any) => void; // Kept for compatibility
  sendMessage: (text: string) => Promise<{ blocked: boolean; warning?: string } | void>; // Updated signature
  initMode: (modeId: string) => void;
  resetChat: () => void;
  loadSession: (sessionId: string) => void; // Added loadSession
  addCustomMode: (mode: { id: string; name: string; phases: Record<string, { title: string; task: string }> }) => void;
  deleteSession: (sessionId: string) => void;
}
