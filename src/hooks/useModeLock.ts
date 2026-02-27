import { useContext } from 'react';
import { ChatContext } from '../context/ChatContext';

export const useModeLock = () => {
  const { state } = useContext(ChatContext);
  return state.isModeLocked;
};
