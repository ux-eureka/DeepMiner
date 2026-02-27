import { useContext } from 'react';
import { ChatContext } from '../context/ChatContext';

export const useChatFlow = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatFlow must be used within a ChatProvider');
  }
  return context;
};
