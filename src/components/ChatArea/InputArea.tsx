import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, Plus } from 'lucide-react';
import { useChatFlow } from '../../hooks/useChatFlow';
import { useModeLock } from '../../hooks/useModeLock';
import { QUESTIONS_CONFIG } from '../../data/questionsConfig';
import { cn } from '../../utils/cn';
import { ModelPresetSelector } from './ModelPresetSelector';
import styles from './InputArea.module.css';
import containerStyles from '../../styles/QuestionContainer.module.css';

export const InputArea: React.FC = () => {
  const { sendMessage, initMode, state, dispatch } = useChatFlow();
  const isLocked = useModeLock();
  const [text, setText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModeName = state.currentMode ? QUESTIONS_CONFIG[state.currentMode]?.mode_name : 'Select Mode';

  const [warning, setWarning] = useState<string | null>(null); // State for inline warning

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

  useEffect(() => {
    // Click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async () => {
    if (text.trim() && state.currentMode) {
      const result = await sendMessage(text);
      if (result && result.blocked) {
          setWarning(result.warning || "输入被拦截");
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
      handleSend();
    }
  };

  return (
    <div className={styles.root}>
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
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={state.currentMode ? "Type your answer..." : "Please select a mode to start..."}
            className="w-full min-h-[80px] max-h-[200px] p-4 pr-12 pb-14 bg-white border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none text-sm leading-relaxed"
            disabled={!state.currentMode || state.isCompleted}
          />
          
          {/* Model Preset Selector - Bottom Left */}
          <div className="absolute left-3 bottom-3 z-20">
              <ModelPresetSelector />
          </div>
          
          {/* Mode Selector - Positioned inside textarea at bottom right, next to Send button */}
          <div className="absolute right-14 bottom-3" ref={dropdownRef}>
            <button
              onClick={() => !isLocked && setShowDropdown(!showDropdown)}
              className={cn(
                "flex items-center justify-between px-3 py-2 text-[13px] font-medium rounded-md transition-colors max-w-[180px]",
                isLocked 
                  ? "text-zinc-400 cursor-not-allowed" 
                  : "text-zinc-600 hover:bg-zinc-100"
              )}
              disabled={isLocked}
            >
              <span className="truncate mr-1">{currentModeName}</span>
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            </button>

            {showDropdown && (
              <div className="absolute bottom-full mb-1 right-0 w-56 bg-white border border-zinc-200 rounded-lg shadow-xl py-1 z-20">
                {Object.values(QUESTIONS_CONFIG).map((mode) => (
                  <button
                    key={mode.mode_id}
                    className="w-full text-left px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 transition-colors truncate"
                    onClick={() => {
                      initMode(mode.mode_id);
                      setShowDropdown(false);
                    }}
                  >
                    {mode.mode_name}
                  </button>
                ))}
                <div className="h-px bg-zinc-100 my-1" />
                <button
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 transition-colors flex items-center"
                  onClick={() => {
                    dispatch({ type: 'TOGGLE_CREATE_MODAL', payload: true });
                    setShowDropdown(false);
                  }}
                >
                  <Plus className="w-3 h-3 mr-2" />
                  Create Mode
                </button>
              </div>
            )}
          </div>

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
