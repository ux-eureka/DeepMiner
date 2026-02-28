import { useState, useCallback, useEffect } from 'react';
import { MODE_CONFIG } from '../config/promptsConfig';
import { useAIConfig } from '../context/AIConfigContext';
import { generateThinkingResponse } from '../lib/llmService';

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
  phases: Record<string, { title: string; task: string }>;
}

export interface EngineState {
  currentModeId: string | null;
  currentPhase: number;
  globalContext: Record<string, string>;
  messages: Message[];
  phases: Record<string, { title: string; task: string }>; // Added phases to state
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
    phases: {},
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
    } catch (e) {
      console.error('Failed to load history from localStorage', e);
      // If history is corrupted, we might want to clear it or ignore it.
      // return;
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
        phases: state.phases, // Save phases
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

      // Initialize state and set processing to true for the initial fetch
      setState(prev => ({
        ...prev,
        currentModeId: modeId,
        currentPhase: 1,
        globalContext: {},
        messages: [],
        phases: mode.phases, // Load initial phases from config
        isProcessing: true, // Show loading
        isCompleted: false,
        hasStarted: false,
      }));

      try {
        const firstPhase = mode.phases[1] || mode.phases['1'];
        
        // --- Call LLM for Initial Message ---
        // For initialization, we want the LLM to generate the first question based on Phase 1 Task.
        // We simulate a "Start" trigger.
        
        let taskContext = `当前需考核的任务（第一阶段）：${firstPhase.task}`;
        // No next task yet, just start.
        taskContext += `\n\n（请开始第一轮提问，严格遵循 JSON 格式）`;

        const reply = await generateThinkingResponse([], '', taskContext, aiConfig);
        
        // --- JSON Parsing for Init ---
        let diagnosis = '';
        let question = '';
        let parsedContent = '';
        
        try {
             const jsonStr = reply.replace(/```json\n?|\n?```/g, '').trim();
             const result = JSON.parse(jsonStr);
             diagnosis = result.diagnosis || '';
             question = result.question || '';
             
             // For init, we don't care about is_passed (it's always "start")
             
             parsedContent = `**${diagnosis}**\n\n${question}`;
        } catch(e) {
             console.error("Init JSON Parse Error", e);
             // Fallback
             if (reply.trim().startsWith('{') && reply.trim().endsWith('}')) {
                 parsedContent = reply;
             } else {
                 parsedContent = reply;
             }
        }

        setState(prev => ({ ...prev, isProcessing: false }));
        appendMessage('system', parsedContent, 1, { title: firstPhase.title });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '初始化失败';
        setState(prev => ({ ...prev, isProcessing: false }));
        appendMessage('system_warning', `系统初始化出错: ${errorMessage}。请重试。`);
      }
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
      // Simulate network delay for history loading (not LLM)
      await new Promise(resolve => setTimeout(resolve, 300));

      setState(prev => {
        const session = prev.history.find(h => h.id === sessionId);
        if (!session) {
          return { ...prev, isLoadingHistory: false, historyError: '会话不存在或已被删除' };
        }

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
          phases: session.phases || MODE_CONFIG[session.modeId]?.phases || {}, // Restore phases or fallback
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
        return { blocked: true, warning: check.warning || '输入无效' };
      }

      // 1. Append user message
      appendMessage('user', userInput, state.currentPhase);
      // 2. Set processing (Loading state)
      setState(prev => ({ ...prev, isProcessing: true }));

      try {
        const mode = MODE_CONFIG[state.currentModeId];
        const currentPhase = state.phases[state.currentPhase];
        
        // --- 3. Call Real LLM Service ---
        // IMPORTANT: If we are retrying (staying in same phase), the "nextTask" should be the CURRENT task, not next phase's task.
        // But the prompt logic says "Next Task" is what we want to guide user to.
        // If user failed, we still want to guide them to complete CURRENT task.
        // So we should pass the CURRENT phase's task if we are stuck, or NEXT phase's task if we are moving forward?
        // Wait, the previous logic was: User input -> Engine assumes it's answering Phase N -> Engine asks LLM to judge -> If passed, move to N+1.
        
        // Correct Logic:
        // The user just answered Phase N.
        // We want LLM to judge if Phase N is completed.
        // If completed, we want to generate a bridge to Phase N+1.
        // If NOT completed, we want to stay in Phase N and ask again.
        
        // So the "Target Task" passed to LLM depends on the context?
        // Actually, the prompt says "Based on [Next Task]... throw a question".
        // This implies the LLM should generate the question for the *next step* IF passed.
        // But if failed, it should regenerate question for *current step*.
        
        // Let's refine:
        // We pass the CURRENT Phase's task as the standard.
        // LLM judges if user input satisfies CURRENT Phase's task.
        // If yes -> is_passed: true -> Question is for NEXT phase.
        // If no -> is_passed: false -> Question is retry for CURRENT phase.
        
        // But wait, the prompt template is fixed: "当前你需要引导的【下一步任务】是：【${nextTask}】".
        // If we pass Phase N+1 task here, and user failed Phase N, LLM might be confused.
        
        // Strategy:
        // We need two calls or a smarter prompt?
        // No, single call.
        // We pass the CURRENT task (Phase N) as the "Audit Target".
        // But we also need to know what the NEXT task is to bridge?
        // The new prompt says: "基于[下一步任务]顺水推舟...".
        
        // Let's stick to the user's instruction:
        // "前端会传入用户的[最新回答]以及你需要完成的[下一步任务]。你需要做裁判"
        // This implies the "Next Task" is the goal.
        // If user is at Phase 1. They answer.
        // We pass Phase 1 Task? Or Phase 2 Task?
        // If we pass Phase 1 Task: "Judge if user answered Phase 1 Task. If so, ask about...?"
        
        // Re-reading User Prompt:
        // "前端会传入用户的[最新回答]以及你需要完成的[下一步任务]... 基于[下一步任务]顺水推舟抛出的问题"
        
        // Interpretation: 
        // The "Next Task" variable in the prompt is actually the GOAL of the question LLM will generate.
        // If user failed Phase N, the "Next Task" (Goal) is still Phase N.
        // If user passed Phase N, the "Next Task" (Goal) is Phase N+1.
        
        // BUT we don't know if they passed yet! That's the problem.
        // The LLM decides.
        
        // So we must pass the *CURRENT* Phase Task as the primary context for judgment?
        // Let's look at the Prompt again:
        // "你需要做裁判... 如果用户说出了具体的物理动作... 判定 is_passed: true"
        
        // This implies judgment is against the *User's Input* (which is an answer to Phase N).
        // So the "Standard" for judgment is Phase N.
        
        // If we pass Phase N+1 as "Next Task", LLM might judge user's answer against Phase N+1 (which is wrong).
        
        // MODIFIED LOGIC:
        // We pass the CURRENT Phase Task as the "Validation Criteria".
        // AND we pass the NEXT Phase Task as "Preview" (optional)?
        // Or simpler:
        // The LLM is smart. 
        // We pass: "Current Task: [Phase N Task]. Next Task: [Phase N+1 Task]"?
        // The user instruction only has one `${nextTask}` slot.
        
        // Let's assume `${nextTask}` in the prompt actually refers to the *Current Active Task* the user is trying to complete.
        // So if user is in Phase 1, we pass Phase 1 Task.
        // LLM judges: Did they answer Phase 1 Task?
        // If No -> is_passed: false. Question: Ask Phase 1 Task again.
        // If Yes -> is_passed: true. Question: Ask Phase 2 Task?
        // Wait, if we only passed Phase 1 Task, how does LLM know Phase 2 Task to ask?
        
        // CRITICAL: The user instruction says "基于[下一步任务]...抛出问题".
        // This implies we MUST pass the task we want the LLM to ask about.
        // If we want it to ask about Phase 2, we must pass Phase 2 Task.
        // But then how does it judge Phase 1?
        
        // Let's try passing BOTH.
        // But I cannot change the prompt structure too much without violating "Strictly execute".
        // The user provided prompt has: "当前你需要引导的【下一步任务】是：【${nextTask}】"
        
        // Let's assume the user wants us to pass the *Target* of the *Upcoming Question*.
        // BUT this breaks the "Judge" logic.
        
        // Compromise:
        // We will pass the CURRENT Phase Task.
        // Reason: The user is currently stuck on Phase 1. The "Task" is Phase 1.
        // If they pass, the LLM says "is_passed: true".
        // THEN, we (Frontend) see "true", we increment Phase to 2.
        // AND we trigger a NEW call to LLM to ask Phase 2 Question?
        // No, that's double calls.
        
        // Alternative Interpretation of "Dynamic Consultant":
        // 1. User answers Phase 1.
        // 2. We send: User Input + Phase 1 Task.
        // 3. LLM judges.
        //    - If Bad: is_passed: false. Question: Retry Phase 1.
        //    - If Good: is_passed: true. Question: Bridge to... Phase 1?? (No, should be Phase 2).
        
        // There is a logical gap in the user's single-prompt architecture.
        // If we only pass one task, we can't do both "Judge Old" and "Ask New" perfectly if they are different tasks.
        
        // However, look at the prompt: "如果回答优秀... 提炼洞察... 顺水推舟抛出问题".
        // Maybe we just pass the CURRENT Phase Task.
        // If passed, the "Question" in JSON will be based on Current Task? No that's redundant.
        
        // Let's look at the provided MODE_CONFIG.
        // Phase 1 Task: "确立物理坐标...".
        // If user answers it well.
        // LLM returns is_passed: true.
        // LLM generates question based on... Phase 1 Task?
        // Then user answers Phase 1 again? Infinite loop.
        
        // SOLUTION:
        // The `nextTask` param in `generateThinkingResponse` should be:
        // - The CURRENT Phase Task (to allow judgment).
        // - PLUS the NEXT Phase Task (to allow bridging).
        
        // I will slightly modify the injection logic in `llmService` to include both if possible, 
        // OR I will concatenate them in the `task` string passed to `generateThinkingResponse`.
        
        // Let's modify `useDeepMinerEngine` to prepare a composite task string.
        
        const currentPhaseObj = state.phases[state.currentPhase];
        const nextPhaseObj = state.phases[state.currentPhase + 1];
        
        // We pass the CURRENT task for judgment context, and NEXT task for bridging.
        // But the prompt slot is single.
        // Let's format it as:
        // "当前阶段任务：[Phase N Task]。下一阶段任务：[Phase N+1 Task]"
        
        let taskContext = `当前需考核的任务：${currentPhaseObj.task}`;
        if (nextPhaseObj) {
            taskContext += `\n\n（若考核通过，请引导进入下一阶段）：${nextPhaseObj.task}`;
        } else {
             taskContext += `\n\n（若考核通过，请进行总结收尾）`;
        }

        const reply = await generateThinkingResponse(state.messages, userInput, taskContext, aiConfig);

        // --- JSON Parsing & Routing Logic ---
         let diagnosis = '';
         let question = '';
         let isPassed = false; 
         let parsedContent = '';
         
         try {
               // ... parsing logic (same as before) ...
               // Remove markdown json wrappers
               const jsonStr = reply.replace(/```json\n?|\n?```/g, '').trim();
               const result = JSON.parse(jsonStr);
               diagnosis = result.diagnosis || '';
               question = result.question || '';
               isPassed = result.is_passed === true;
               
               // Only use parsed content if JSON parse succeeded
               parsedContent = `**${diagnosis}**\n\n${question}`;
          } catch(e) {
               // Fallback: If JSON parse fails, it might be raw text or partial JSON
               console.error("JSON Parse Error", e);
               isPassed = false; // Fail safe
               
               // Try to salvage if it looks like JSON but failed to parse (e.g. unescaped chars)
               // Or just show raw reply if it's text
               // But if reply is the JSON string itself (e.g. due to double escaping or formatting),
               // we want to avoid showing raw JSON to user if possible.
               // However, if we can't parse it, we can't extract fields.
               // Let's check if it starts with { and ends with }
               if (reply.trim().startsWith('{') && reply.trim().endsWith('}')) {
                   // It's likely broken JSON.
                   // Show a friendly error or raw text?
                   // Let's show raw text but maybe wrap it?
                   parsedContent = reply; 
               } else {
                   // It's likely normal text (LLM ignored JSON instruction)
                   parsedContent = reply;
               }
          }

        if (isPassed) {
            // Passed: Move to next phase
            const nextPhaseNum = state.currentPhase + 1;
            const nextPhase = state.phases[nextPhaseNum];
            
            if (nextPhase) {
                setState(prev => ({
                    ...prev,
                    currentPhase: nextPhaseNum,
                    isProcessing: false,
                }));
                appendMessage('system', parsedContent, nextPhaseNum, { title: nextPhase.title });
            } else {
                 // Completion case
                 setState(prev => ({ ...prev, isCompleted: true, isProcessing: false }));
                 appendMessage('system', parsedContent, state.currentPhase, { title: "总结" });
            }
        } else {
            // Failed: Stay
            setState(prev => ({ ...prev, isProcessing: false }));
            appendMessage('system', parsedContent, state.currentPhase, { title: currentPhaseObj.title });
        }

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
      
      if (prev.messages[0]?.id === sessionId) {
          return {
              ...prev,
              currentModeId: null,
              currentPhase: 1,
              globalContext: {},
              messages: [],
              phases: {},
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

  const appendPhase = useCallback((title: string, task: string) => {
    setState(prev => {
        const nextPhaseNum = Object.keys(prev.phases).length + 1;
        return {
            ...prev,
            phases: {
                ...prev.phases,
                [nextPhaseNum]: { title, task }
            }
        };
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
    appendPhase,
  };
};
