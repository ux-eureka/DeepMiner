import { useContext } from 'react';
import { ChatContext } from '../context/ChatContext';
import { MODE_CONFIG } from '../config/promptsConfig';
import { PhaseProgress } from '../types';

export const useProgress = (): PhaseProgress[] => {
  const { state } = useContext(ChatContext);
  if (!state.currentMode) return [];
  
  // Use dynamic phases from state if available, otherwise fallback to static config
  const phases = state.phases || MODE_CONFIG[state.currentMode]?.phases;
  
  if (!phases) return [];

  const phaseKeys = Object.keys(phases).sort((a, b) => parseInt(a) - parseInt(b));
  
  return phaseKeys.map(phaseKey => {
      const currentPhaseInt = parseInt(state.currentPhase);
      const phaseInt = parseInt(phaseKey);
      
      const isCompleted = state.isCompleted || phaseInt < currentPhaseInt;
      const isActive = phaseInt === currentPhaseInt && !state.isCompleted;
      
      return {
        phase: phaseKey,
        title: phases[phaseKey].title,
        isCompleted,
        isActive
      };
  });
};
