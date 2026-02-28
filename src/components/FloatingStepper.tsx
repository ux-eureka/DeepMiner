import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useProgress } from '../hooks/useProgress';
import { useChatFlow } from '../hooks/useChatFlow';
import { cn } from '../utils/cn';
import { VirtualStepperList } from './VirtualStepperList';

export const FloatingStepper: React.FC = () => {
  const { state } = useChatFlow();
  const progress = useProgress();
  const [isHovered, setIsHovered] = useState(false);

  if (!state.currentMode || state.messages.length === 0) return null;

  const handlePhaseClick = (phaseId: string) => {
    const element = document.getElementById(`phase-${phaseId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return createPortal(
    <div
      className="fixed right-0 top-1/2 -translate-y-1/2 z-[100]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className={cn(
          "flex items-center transition-all duration-300 transform-gpu",
          isHovered ? "w-64" : "w-12"
        )}
      >
        <div
          className={cn(
            "bg-white/90 backdrop-blur-sm rounded-l-xl overflow-hidden transition-all duration-300",
            isHovered ? "w-full p-4" : "w-12 py-4 px-2"
          )}
        >
          <VirtualStepperList 
            progress={progress}
            isHovered={isHovered}
            onPhaseClick={handlePhaseClick}
          />
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
