import { useState, useCallback, useEffect } from 'react';
import { MODE_CONFIG } from '../config/promptsConfig';
import { useAIConfig } from '../context/AIConfigContext';
import { buildThinkingPartnerPrompt, callThinkingPartner } from '../lib/engineUtils';

export interface Message {
  id: string;
  type: 'system' | 'user' | 'system_warning';
  content: string;
  phase?: number;
  timestamp: number;
  data?: {
    title: string;
    questions?: string[];
  };
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

export interface EngineState {
  currentModeId: string | null;
  currentPhase: number;
  globalContext: Record<string, string>;
  messages: Message[];
  isProcessing: boolean;
  isCompleted: boolean;
  hasStarted: boolean;
  history: ChatHistoryItem[];
  isLoadingHistory: boolean;
  historyError: string | null;
}

const checkInterceptor = (text: string): { blocked: boolean; warning?: string } => {
  if (/(不知道|忘了|不清楚|没想好|跳过)/.test(text)) {
    return { 
      blocked: true, 
      warning: '⚠️ 核心逻辑缺失！请补充具体事实，哪怕是目前遇到的困难，也不能直接跳过。' 
    };
  }
  return { blocked: false };
};

export const useDeepMinerEngine = () => {
  const { config: aiConfig } = useAIConfig();

  const [state, setState] = useState<EngineState>({
    currentModeId: null,
    currentPhase: 1,
    globalContext: {},
    messages: [],
    isProcessing: false,
    isCompleted: false,
    hasStarted: false,
    history: [],
    isLoadingHistory: false,
    historyError: null,
  });

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('deepminer_history');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setState(prev => ({ ...prev, history: parsedHistory }));
      }
    } catch {
      return;
    }
  }, []);

  useEffect(() => {
    if (state.history.length > 0) {
      localStorage.setItem('deepminer_history', JSON.stringify(state.history));
    }
  }, [state.history]);

  useEffect(() => {
    if (!state.hasStarted || !state.currentModeId) return;

    const sessionId = state.messages[0]?.id || Date.now().toString();
    const modeName = MODE_CONFIG[state.currentModeId]?.name || state.currentModeId;
    const sessionTitle = `${modeName} - ${new Date().toLocaleDateString()}`;

    setState(prev => {
      const existingIndex = prev.history.findIndex(h => h.id === sessionId);
      const newHistoryItem: ChatHistoryItem = {
        id: sessionId,
        modeId: state.currentModeId!,
        title: sessionTitle,
        timestamp: Date.now(),
        active: true,
        messages: state.messages,
        globalContext: state.globalContext,
        currentPhase: state.currentPhase,
        isCompleted: state.isCompleted,
      };

      let updatedHistory: ChatHistoryItem[];
      if (existingIndex >= 0) {
        updatedHistory = [...prev.history];
        updatedHistory[existingIndex] = newHistoryItem;
      } else {
        updatedHistory = [newHistoryItem, ...prev.history];
      }

      updatedHistory = updatedHistory.map(item => ({
        ...item,
        active: item.id === sessionId,
      }));

      return { ...prev, history: updatedHistory };
    });
  }, [state.messages, state.currentPhase, state.isCompleted, state.globalContext, state.currentModeId, state.hasStarted]);

  const appendMessage = useCallback((type: Message['type'], content: string, phase?: number, data?: Message['data']) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      type,
      content,
      phase,
      timestamp: Date.now(),
      data,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage],
    }));
  }, []);

  const initMode = useCallback(
    async (modeId: string) => {
      const mode = MODE_CONFIG[modeId];
      if (!mode) return;

      setState(prev => ({
        ...prev,
        currentModeId: modeId,
        currentPhase: 1,
        globalContext: {},
        messages: [],
        isProcessing: false,
        isCompleted: false,
        hasStarted: false,
      }));

      const firstPhase = mode.phases[1] || mode.phases['1'];
      const prompt = buildThinkingPartnerPrompt('', firstPhase.task, []);
      const reply = await callThinkingPartner(prompt, aiConfig);

      setTimeout(() => {
        appendMessage('system', reply, 1, { title: firstPhase.title });
      }, 50);
    },
    [appendMessage, aiConfig]
  );

  const addCustomMode = useCallback(
    (mode: { id: string; name: string; phases: Record<string, { title: string; task: string }> }) => {
      MODE_CONFIG[mode.id] = {
        id: mode.id,
        name: mode.name,
        phases: mode.phases,
      };
      setState(prev => ({ ...prev }));
    },
    []
  );

  const loadSession = useCallback(async (sessionId: string) => {
    setState(prev => ({ ...prev, isLoadingHistory: true, historyError: null }));

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));

      setState(prev => {
        const session = prev.history.find(h => h.id === sessionId);
        if (!session) {
          return { ...prev, isLoadingHistory: false, historyError: '会话不存在或已被删除' };
        }

        // Ensure MODE_CONFIG has the mode (handle custom modes)
        if (!MODE_CONFIG[session.modeId]) {
           return { 
             ...prev, 
             isLoadingHistory: false, 
             historyError: `无法加载会话：模式 "${session.modeId}" 定义缺失。请确认是否为自定义模式且已重新导入。` 
           };
        }

        return {
          ...prev,
          currentModeId: session.modeId,
          currentPhase: session.currentPhase,
          globalContext: session.globalContext,
          messages: session.messages,
          isProcessing: false,
          isCompleted: session.isCompleted,
          hasStarted: true,
          isLoadingHistory: false,
          history: prev.history.map(h => ({ ...h, active: h.id === sessionId })),
        };
      });
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isLoadingHistory: false, 
        historyError: '加载会话失败，请检查网络或重试。' 
      }));
    }
  }, []);

  const processInput = useCallback(
    async (userInput: string) => {
      if (!state.currentModeId || state.isProcessing || state.isCompleted) return;

      if (!state.hasStarted) {
        setState(prev => ({ ...prev, hasStarted: true }));
      }

      const check = checkInterceptor(userInput);
      if (check.blocked) {
        // Return object so caller (UI) can handle warning
        return { blocked: true, warning: check.warning || '输入无效' };
      }

      appendMessage('user', userInput, state.currentPhase);
      setState(prev => ({ ...prev, isProcessing: true }));

      try {
        const mode = MODE_CONFIG[state.currentModeId];
        const nextPhaseNum = state.currentPhase + 1;
        const nextPhase = mode?.phases[nextPhaseNum] || mode?.phases[String(nextPhaseNum)];

        if (!nextPhase) {
          setState(prev => ({
            ...prev,
            isCompleted: true,
            isProcessing: false,
          }));
          return;
        }

        const prompt = buildThinkingPartnerPrompt(userInput, nextPhase.task, state.messages);
        const reply = await callThinkingPartner(prompt, aiConfig);

        setTimeout(() => {
          setState(prev => ({
            ...prev,
            currentPhase: nextPhaseNum,
            isProcessing: false,
          }));
          appendMessage('system', reply, nextPhaseNum, { title: nextPhase.title });
        }, 200);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        appendMessage('system_warning', `系统处理出错: ${errorMessage}。请重试。`);
        setState(prev => ({ ...prev, isProcessing: false }));
      }
    },
    [state, appendMessage, aiConfig]
  );

  const resetEngine = useCallback(() => {
    setState(prev => ({
      currentModeId: null,
      currentPhase: 1,
      globalContext: {},
      messages: [],
      isProcessing: false,
      isCompleted: false,
      hasStarted: false,
      history: prev.history,
      isLoadingHistory: false,
      historyError: null,
    }));
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setState(prev => {
      const updatedHistory = prev.history.filter(h => h.id !== sessionId);
      
      // If we deleted the active session, reset to initial state
      if (prev.messages[0]?.id === sessionId) {
          return {
              ...prev,
              currentModeId: null,
              currentPhase: 1,
              globalContext: {},
              messages: [],
              isProcessing: false,
              isCompleted: false,
              hasStarted: false,
              history: updatedHistory,
              isLoadingHistory: false,
              historyError: null,
          };
      }

      return { ...prev, history: updatedHistory };
    });
  }, []);

  return {
    state,
    initMode,
    sendMessage: processInput,
    resetEngine,
    loadSession,
    addCustomMode,
    deleteSession,
  };
};

