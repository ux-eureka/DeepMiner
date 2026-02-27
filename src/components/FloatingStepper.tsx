import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { useProgress } from '../hooks/useProgress';
import { useChatFlow } from '../hooks/useChatFlow';
import { cn } from '../utils/cn';

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
          <div className="flex flex-col space-y-4">
            {progress.map((p) => (
              <div
                key={p.phase}
                className={cn(
                  "flex items-center cursor-pointer group transition-all duration-200 rounded-md",
                  isHovered ? "gap-3 px-2 py-1 hover:bg-zinc-100/70" : "justify-center"
                )}
                onClick={() => handlePhaseClick(p.phase)}
              >
                <div
                  className={cn(
                    "w-3 h-3 rounded-full border-2 transition-all shrink-0 relative",
                    p.isActive
                      ? "border-emerald-500 bg-emerald-500 scale-125"
                      : p.isCompleted
                        ? "border-emerald-300 bg-emerald-300"
                        : "border-zinc-300 bg-white"
                  )}
                >
                  {p.isCompleted && !p.isActive && isHovered && (
                    <CheckCircle2 className="w-2 h-2 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  )}
                </div>

                <div
                  className={cn(
                    "flex flex-col transition-opacity duration-200 whitespace-nowrap overflow-hidden",
                    isHovered ? "opacity-100 w-auto" : "opacity-0 w-0"
                  )}
                >
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase mb-0.5",
                      p.isActive
                        ? "text-emerald-600"
                        : p.isCompleted
                          ? "text-emerald-400"
                          : "text-zinc-400"
                    )}
                  >
                    PHASE {p.phase}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-medium truncate max-w-[160px]",
                      p.isActive
                        ? "text-zinc-900"
                        : p.isCompleted
                          ? "text-zinc-500"
                          : "text-zinc-400"
                    )}
                  >
                    {p.title}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>,
    document.body
  );
};
