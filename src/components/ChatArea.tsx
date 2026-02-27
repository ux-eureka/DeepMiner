import React, { useEffect, useRef } from 'react';
import { useChatFlow } from '../hooks/useChatFlow';
import { SystemCard } from './ChatArea/SystemCard';
import { UserBubble } from './ChatArea/UserBubble';
import { InputArea } from './ChatArea/InputArea';
import styles from './ChatArea.module.css';
import containerStyles from '../styles/QuestionContainer.module.css';

export const ChatArea: React.FC = () => {
  const { state } = useChatFlow();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom when messages change
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages, state.isLoading]);

  return (
    <div className={styles.root}>
      <div className={`${styles.scrollArea} scrollbar-thin`}>
        <div className={containerStyles.container}>
          {state.messages.length === 0 && !state.currentMode ? (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
              <p>Select a mode to start diagnosis</p>
            </div>
          ) : (
            <>
              {state.messages.map((msg) =>
                msg.type === 'user' ? (
                  <UserBubble key={msg.id} content={msg.content} />
                ) : (
                  <SystemCard
                    key={msg.id}
                    content={msg.content}
                    phase={msg.phase?.toString()}
                    type={msg.type === 'system_warning' ? 'system_warning' : 'system'}
                    data={msg.data as any}
                  />
                )
              )}

              {state.isLoading && (
                <div className="flex items-center space-x-2 text-zinc-400 ml-12 mb-6">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}

              <div ref={bottomRef} className="h-4" />
            </>
          )}
        </div>
      </div>

      <InputArea />
    </div>
  );
};
