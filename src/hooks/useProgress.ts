import { useContext } from 'react';
import { ChatContext } from '../context/ChatContext';
import { MODE_CONFIG } from '../config/promptsConfig';
import { PhaseProgress } from '../types';

export const useProgress = (): PhaseProgress[] => {
  const { state } = useContext(ChatContext);
  if (!state.currentMode) return [];
  
  const mode = MODE_CONFIG[state.currentMode];
  if (!mode) return [];

  const phaseKeys = Object.keys(mode.phases).sort((a, b) => parseInt(a) - parseInt(b));
  
  return phaseKeys.map(phaseKey => {
      const currentPhaseInt = parseInt(state.currentPhase);
      const phaseInt = parseInt(phaseKey);
      
      const isCompleted = state.isCompleted || phaseInt < currentPhaseInt;
      const isActive = phaseInt === currentPhaseInt && !state.isCompleted;
      
      return {
        phase: phaseKey,
        title: mode.phases[phaseKey].title,
        isCompleted,
        isActive
      };
  });
};
