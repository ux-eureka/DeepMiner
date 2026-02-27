import { useState, useCallback, useRef, useEffect } from 'react';
import { QUESTIONS_CONFIG, ModeConfig, PhaseConfig } from '../data/questionsConfig';
import { useAIConfig } from '../context/AIConfigContext';

// --- Types ---

export interface Message {
  id: string;
  type: 'system' | 'user' | 'system_warning';
  content: string;
  phase?: number;
  timestamp: number;
  data?: {
    title: string;
    questions: string[];
  };
}

export interface EngineState {
  currentModeId: string | null;
  currentPhase: number;
  globalContext: Record<string, string>;
  messages: Message[];
  isProcessing: boolean;
  isCompleted: boolean;
  hasStarted: boolean;
  history: ChatHistoryItem[]; // Added history to EngineState
}

export interface ChatHistoryItem {
    id: string;
    modeId: string;
    title: string;
    timestamp: number;
    active: boolean;
    messages: Message[]; // Store messages for restoring session
    globalContext: Record<string, string>;
    currentPhase: number;
    isCompleted: boolean;
}

// --- Helpers ---

// 1. Interceptor: Check for abstract keywords
const checkInterceptor = (text: string): { blocked: boolean; warning?: string } => {
  // 禁用拦截功能
  return { blocked: false };
  /*
  const forbiddenKeywords = ['优化', '体验', '直观', '美观', '大气', '高端'];
  const found = forbiddenKeywords.filter(k => text.includes(k));
  
  if (found.length > 0) {
    return {
      blocked: true,
      warning: `[系统拦截] 检测到抽象形容词 "${found.join(', ')}"。禁止使用抽象词汇，请描述具体的物理动作或业务事实。`
    };
  }
  return { blocked: false };
  */
};

// 2. Template Hydration: Replace {{placeholders}} with context values
const hydrateTemplate = (text: string, context: Record<string, string>): string => {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return context[key] || `[该${key}]`; // Fallback if context missing
  });
};

// --- Mock LLM Extraction (Replace with real API call later) ---
const mockExtractVariables = async (
  text: string, 
  variables: string[]
): Promise<Record<string, string>> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simple heuristic mock for demo purposes
  const result: Record<string, string> = {};
  
  variables.forEach(v => {
    if (v === 'user_role') result[v] = text.includes('员') ? text.split('员')[0] + '员' : '该角色';
    else if (v === 'core_asset') result[v] = '该资产'; // Placeholder
    else if (v === 'target_user') result[v] = '该用户';
    else if (v === 'core_desire') result[v] = '该欲望';
    else result[v] = `[${v}]`;
  });
  
  console.log('[Mock LLM] Extracted:', result);
  return result;
};

// --- Real LLM Extraction ---
const callLLMExtraction = async (
  text: string,
  variables: string[],
  config: any
): Promise<Record<string, string>> => {
  if (!config.apiKey && config.provider !== 'custom') {
     console.warn("Missing API Key, falling back to mock");
     return mockExtractVariables(text, variables);
  }

  const prompt = `
    You are a data extraction engine.
    User Input: "${text}"
    
    Task: Extract the following variables from the user input.
    Variables to extract: ${JSON.stringify(variables)}
    
    Return ONLY a valid JSON object. Keys must be exactly as requested.
    If a variable is not found, use null or a reasonable inference based on context.
    Do not explain.
  `;

  try {
    let responseText = '';
    const baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash

    if (config.provider === 'openai' || config.provider === 'deepseek' || config.provider === 'custom') {
        const response = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that outputs JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.1,
                max_tokens: 500,
                response_format: { type: "json_object" } // Try to force JSON mode if supported
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errText}`);
        }

        const data = await response.json();
        responseText = data.choices[0]?.message?.content || '';

    } else if (config.provider === 'anthropic') {
         const response = await fetch(`${baseUrl}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: config.model,
                messages: [
                    { role: 'user', content: prompt }
                ],
                max_tokens: 500
            })
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errText}`);
        }

        const data = await response.json();
        responseText = data.content[0]?.text || '';
        
    } else if (config.provider === 'google') {
         const response = await fetch(`${baseUrl}/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        
         if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error: ${response.status} ${response.statusText} - ${errText}`);
        }

        const data = await response.json();
        responseText = data.candidates[0]?.content?.parts[0]?.text || '';
    }

    if (!responseText) {
        throw new Error("Empty response from LLM");
    }

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    } else {
        console.warn("LLM did not return JSON, trying direct parse");
        return JSON.parse(responseText);
    }

  } catch (error) {
    console.error("LLM Extraction Failed:", error);
    // Return mock data as fallback to prevent app crash
    return mockExtractVariables(text, variables);
  }
}

// --- Main Hook ---

export const useDeepMinerEngine = () => {
  const { config: aiConfig } = useAIConfig(); // Access AI settings
  
  const [state, setState] = useState<EngineState>({
    currentModeId: null,
    currentPhase: 1,
    globalContext: {},
    messages: [],
    isProcessing: false,
    isCompleted: false,
    hasStarted: false,
    history: [],
  });

  // Load history from local storage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('deepminer_history');
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        setState(prev => ({ ...prev, history: parsedHistory }));
      }
    } catch (e) {
      console.error('Failed to load history:', e);
    }
  }, []);

  // Save history to local storage whenever it changes
  useEffect(() => {
    if (state.history.length > 0) {
       localStorage.setItem('deepminer_history', JSON.stringify(state.history));
    }
  }, [state.history]);

  // Save current session to history when state updates (debounced or on critical changes)
  useEffect(() => {
      if (state.hasStarted && state.currentModeId) {
          const sessionId = state.messages[0]?.id || Date.now().toString(); // Use first message ID as session ID or generate one
          const sessionTitle = `${QUESTIONS_CONFIG[state.currentModeId]?.mode_name} - ${new Date().toLocaleDateString()}`;

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
                  isCompleted: state.isCompleted
              };

              let updatedHistory;
              if (existingIndex >= 0) {
                  updatedHistory = [...prev.history];
                  updatedHistory[existingIndex] = newHistoryItem;
              } else {
                  updatedHistory = [newHistoryItem, ...prev.history];
              }
              
              // Deactivate other history items
              updatedHistory = updatedHistory.map(item => ({
                  ...item,
                  active: item.id === sessionId
              }));

              return { ...prev, history: updatedHistory };
          });
      }
  }, [state.messages, state.currentPhase, state.isCompleted, state.globalContext, state.currentModeId, state.hasStarted]);


  // Helper to append message
  const appendMessage = useCallback((type: Message['type'], content: string, phase?: number, data?: Message['data']) => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      content,
      phase,
      timestamp: Date.now(),
      data,
    };
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));
  }, []);

  // Initialize a mode
  const initMode = useCallback((modeId: string) => {
    const config = QUESTIONS_CONFIG[modeId];
    if (!config) return;

    setState(prev => ({
      ...prev,
      currentModeId: modeId,
      currentPhase: 1,
      globalContext: {},
      messages: [],
      isProcessing: false,
      isCompleted: false,
      hasStarted: false,
      // Keep history
    }));

    // Send first phase questions
    const firstPhase = config.phases["1"];
    const questionText = firstPhase.questions.join('\n\n');
    
    // Initial system message
    setTimeout(() => {
        appendMessage('system', questionText, 1, {
            title: firstPhase.title,
            questions: firstPhase.questions
        });
    }, 100);
    
  }, [appendMessage]);

  // Load a session from history
  const loadSession = useCallback((sessionId: string) => {
      setState(prev => {
          const session = prev.history.find(h => h.id === sessionId);
          if (!session) return prev;

          return {
              ...prev,
              currentModeId: session.modeId,
              currentPhase: session.currentPhase,
              globalContext: session.globalContext,
              messages: session.messages,
              isProcessing: false,
              isCompleted: session.isCompleted,
              hasStarted: true, // Assuming loaded sessions are started
              history: prev.history.map(h => ({ ...h, active: h.id === sessionId }))
          };
      });
  }, []);

  // Handle user input (The Engine Loop)
  const processInput = useCallback(async (userInput: string) => {
    if (!state.currentModeId || state.isProcessing || state.isCompleted) return;
    
    // Mark as started once user sends a message
    if (!state.hasStarted) {
      setState(prev => ({ ...prev, hasStarted: true }));
    }

    // Step 1: Interceptor (Moved to before message append)
    const check = checkInterceptor(userInput);
    if (check.blocked) {
        return { blocked: true, warning: check.warning || '输入无效' };
    }

    const modeConfig = QUESTIONS_CONFIG[state.currentModeId];
    const currentPhaseConfig = modeConfig.phases[String(state.currentPhase)];
    
    // 0. Update UI with user message (Only if passed interceptor)
    appendMessage('user', userInput, state.currentPhase);
    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      // Step 2: Extraction (Real LLM Call)
      let newContext = { ...state.globalContext };
      if (currentPhaseConfig.extract_variables && currentPhaseConfig.extract_variables.length > 0) {
        // Use real LLM extraction if configured, otherwise fallback to mock is handled inside callLLMExtraction
        const extracted = await callLLMExtraction(userInput, currentPhaseConfig.extract_variables, aiConfig);
        newContext = { ...newContext, ...extracted };
      }

      // Prepare Next Phase
      const nextPhaseNum = state.currentPhase + 1;
      const nextPhaseConfig = modeConfig.phases[String(nextPhaseNum)];

      if (!nextPhaseConfig) {
        // Step 4 (Branch B): End of Flow -> Synthesis
        setState(prev => ({ 
          ...prev, 
          globalContext: newContext, 
          isCompleted: true, 
          isProcessing: false 
        }));
        appendMessage('system', '✅ 诊断完成！系统正在生成最终分析报告...', nextPhaseNum - 1);
        return;
      }

      // Step 3: Template Hydration
      const nextQuestions = nextPhaseConfig.questions.map(q => hydrateTemplate(q, newContext));
      const nextQuestionText = nextQuestions.join('\n\n');

      // Step 4 (Branch A): UI Render & State Update
      setTimeout(() => {
        setState(prev => ({
          ...prev,
          currentPhase: nextPhaseNum,
          globalContext: newContext,
          isProcessing: false
        }));
        
        appendMessage('system', nextQuestionText, nextPhaseNum, {
            title: nextPhaseConfig.title,
            questions: nextQuestions
        });
      }, 500);

    } catch (error) {
      console.error("Engine Error:", error);
      // Display clearer error message
      const errorMessage = error instanceof Error ? error.message : "未知错误";
      appendMessage('system_warning', `系统处理出错: ${errorMessage}。请重试。`);
      setState(prev => ({ ...prev, isProcessing: false }));
    }

  }, [state, appendMessage, aiConfig]);

  // Reset
  const resetEngine = useCallback(() => {
    setState(prev => ({
      currentModeId: null,
      currentPhase: 1,
      globalContext: {},
      messages: [],
      isProcessing: false,
      isCompleted: false,
      hasStarted: false,
      history: prev.history, // Preserve history from previous state
    }));
  }, []);

  return {
    state,
    initMode,
    sendMessage: processInput,
    resetEngine,
    loadSession
  };
};
