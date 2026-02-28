import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, Plus, Eye, X, Copy, Check } from 'lucide-react';
import { useChatFlow } from '../../hooks/useChatFlow';
import { useModeLock } from '../../hooks/useModeLock';
import { MODE_CONFIG } from '../../config/promptsConfig';
import { cn } from '../../utils/cn';
import { ModelPresetSelector } from './ModelPresetSelector';
import styles from './InputArea.module.css';
import containerStyles from '../../styles/QuestionContainer.module.css';

// Prompt Preview Modal Component
const PromptPreviewModal = ({ content, onClose }: { content: string; onClose: () => void }) => {
    const [copied, setCopied] = useState(false);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(content);
            setCopied(true);
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div 
                className="bg-white rounded-xl shadow-2xl w-[90vw] max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                    <h3 className="text-lg font-semibold text-zinc-900">提示词预览</h3>
                    <div className="flex items-center gap-2">
                         <button 
                            onClick={handleCopy}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                                copied 
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                                    : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
                            )}
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>已复制</span>
                                </>
                            ) : (
                                <>
                                    <Copy className="w-4 h-4" />
                                    <span>复制</span>
                                </>
                            )}
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-md transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-hidden p-6 bg-zinc-50/50">
                    <textarea 
                        readOnly
                        value={content}
                        className="w-full h-full min-h-[300px] p-4 bg-white border border-zinc-200 rounded-lg text-sm font-mono text-zinc-600 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-slate-200 selection:bg-slate-100"
                    />
                </div>
            </div>
        </div>
    );
};

export const InputArea: React.FC = () => {
  const { sendMessage, initMode, state, dispatch } = useChatFlow();
  const isLocked = useModeLock();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Use state.isLoadingHistory for loading feedback
  const isLoading = state.isLoadingHistory;

  const currentModeName = state.currentMode ? MODE_CONFIG[state.currentMode]?.name : '选择模式';

  const [warning, setWarning] = useState<string | null>(null); // State for inline warning

  // Sync engine history error to warning
  useEffect(() => {
    if (state.historyError) {
        setWarning(state.historyError);
    }
  }, [state.historyError]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [text]);

  useEffect(() => {
    if (warning) {
        const timer = setTimeout(() => setWarning(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [warning]);

  const handleSend = async () => {
    // Check interception BEFORE sending to engine
    // Since interceptor logic is inside engine's sendMessage (processInput),
    // and processInput returns { blocked: boolean; warning?: string } | void
    // We rely on the return value.
    // However, the interceptor logic itself is synchronous and simple.
    // To provide instant feedback without async delay if possible, we could check here too,
    // but better to keep single source of truth in the engine.
    
    // BUT: If the user inputs "忘记了", the engine's processInput will return blocked object.
    // Let's ensure we handle that return value correctly.
    
    if (text.trim() && state.currentMode) {
      const result = await sendMessage(text);
      if (result && result.blocked) {
          setWarning(result.warning || "输入被拦截");
          // Do NOT clear text if blocked, so user can edit it
      } else {
          setText('');
          setWarning(null);
          // Refocus textarea after sending
          if (textareaRef.current) {
              textareaRef.current.focus();
          }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Add composition check to avoid triggering send during IME composition (e.g. Pinyin)
      if (e.nativeEvent.isComposing || textareaRef.current?.getAttribute('data-composing') === 'true') return;
      handleSend();
    }
  };

  const [showModeSelector, setShowModeSelector] = useState(false);
  const modeSelectorRef = useRef<HTMLDivElement>(null);
  
  // Prompt Preview State
  const [previewPrompt, setPreviewPrompt] = useState<string | null>(null);

  useEffect(() => {
    // Click outside to close mode selector
    const handleClickOutside = (event: MouseEvent) => {
      if (modeSelectorRef.current && !modeSelectorRef.current.contains(event.target as Node)) {
        setShowModeSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Format prompt for preview
  const getPromptContent = (mode: typeof MODE_CONFIG[keyof typeof MODE_CONFIG]) => {
      // Create a readable string format
      const phasesText = Object.entries(mode.phases)
          .map(([phaseId, phase]) => `[Phase ${phaseId}: ${phase.title}]\nTask: ${phase.task}`)
          .join('\n\n');
          
      return `模式名称：${mode.name}\nID：${mode.id}\n\n=== 阶段流程 ===\n\n${phasesText}`;
  };

  return (
    <div className={styles.root}>
      {/* Preview Modal */}
      {previewPrompt && (
          <PromptPreviewModal 
            content={previewPrompt} 
            onClose={() => setPreviewPrompt(null)} 
          />
      )}
      <div className={containerStyles.container}>
        <div className={styles.inner}>
          {warning && (
            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg shadow-sm text-sm font-medium animate-in fade-in slide-in-from-bottom-2 z-50 whitespace-nowrap flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {warning}
            </div>
          )}

          <div className="relative">
          {/* Mode Selection Overlay - Replaces Placeholder */}
          {!state.currentMode && (
             <div className="absolute inset-0 p-4 z-10 pointer-events-none flex flex-wrap items-start content-start gap-1 text-sm leading-relaxed text-zinc-400">
                <span>请选择诊断模式以开始</span>
                <button
                    onClick={() => setShowModeSelector(true)}
                    className="text-[#28a745] font-semibold hover:underline focus:outline-none pointer-events-auto"
                    aria-label="选择诊断模式"
                >
                    [选择模式]
                </button>
             </div>
          )}

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            // Add composition event handlers
            onCompositionStart={() => {
                // We can use a ref or data attribute to track composition state if nativeEvent.isComposing is not reliable across all browsers,
                // but nativeEvent.isComposing is standard.
                // However, React's onKeyDown might fire before compositionEnd in some cases.
                // A common practice is to use a ref flag.
                textareaRef.current?.setAttribute('data-composing', 'true');
            }}
            onCompositionEnd={() => {
                textareaRef.current?.removeAttribute('data-composing');
            }}
            placeholder={state.currentMode ? "在此输入您的回答..." : ""} 
            className="w-full min-h-[80px] max-h-[200px] p-4 pr-12 pb-14 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none text-sm leading-relaxed disabled:bg-gray-50"
            disabled={!state.currentMode || state.isCompleted || isLoading}
          />
          
          {/* Loading Overlay */}
          {isLoading && (
              <div className="absolute inset-0 bg-white/50 z-20 flex items-center justify-center rounded-xl">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-600"></div>
              </div>
          )}
          
          {/* Mode Selector Popup */}
          {showModeSelector && (
              <div 
                ref={modeSelectorRef}
                className="absolute bottom-16 left-4 w-64 bg-white border border-zinc-200 rounded-lg shadow-xl py-1 z-30 animate-in fade-in zoom-in duration-200"
              >
                {Object.values(MODE_CONFIG).map((mode) => (
                  <div 
                    key={mode.id}
                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center justify-between group"
                  >
                    <button
                        className="flex-1 text-left truncate mr-2"
                        onClick={() => {
                            initMode(mode.id);
                            setShowModeSelector(false);
                        }}
                    >
                        {mode.name}
                    </button>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setPreviewPrompt(getPromptContent(mode));
                            }}
                            className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="预览提示词"
                        >
                            <Eye className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => {
                                initMode(mode.id);
                                setShowModeSelector(false);
                            }}
                            className="text-blue-500 text-xs font-medium hover:underline px-1"
                        >
                            选择
                        </button>
                    </div>
                  </div>
                ))}
                <div className="h-px bg-zinc-100 my-1" />
                <button
                  className="w-full text-left px-4 py-2.5 text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors flex items-center"
                  onClick={() => {
                    dispatch({ type: 'TOGGLE_CREATE_MODAL', payload: true });
                    setShowModeSelector(false);
                  }}
                >
                  <Plus className="w-3 h-3 mr-2" />
                  新建模式
                </button>
              </div>
          )}
          
          {/* Model Preset Selector - Bottom Left */}
          <div className="absolute left-3 bottom-3 z-20">
              <ModelPresetSelector />
          </div>
          
          {/* Mode Indicator - Positioned inside textarea at bottom right, next to Send button */}
          {state.currentMode && (
            <div className="absolute right-14 bottom-3">
                <button
                className={cn(
                    "flex items-center justify-between px-3 py-2 text-[13px] font-medium rounded-md transition-colors max-w-[180px]",
                    "text-zinc-400 bg-transparent cursor-default" 
                )}
                disabled={true}
                >
                <span className="truncate mr-1">{currentModeName}</span>
                </button>
            </div>
          )}

          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={!text.trim() || !state.currentMode || state.isLoading}
            className={cn(
              "absolute right-3 bottom-3 p-2 rounded-lg transition-colors",
              text.trim() && state.currentMode && !state.isLoading
                ? "bg-slate-700 text-white hover:bg-slate-800"
                : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
            )}
          >
            <Send className="w-4 h-4" />
          </button>
          </div>
        </div>
      </div>
    </div>
  );
};
