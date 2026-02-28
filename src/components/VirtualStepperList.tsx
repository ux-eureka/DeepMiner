import React, { useRef, useEffect, useState } from 'react';
import { cn } from '../utils/cn';
import { CheckCircle2 } from 'lucide-react';
import { PhaseProgress } from '../types';

interface VirtualStepperListProps {
  progress: PhaseProgress[];
  isHovered: boolean;
  onPhaseClick: (phase: string) => void;
}

const ITEM_HEIGHT = 48; // Approximate height for collapsed item (circle + padding)
const EXPANDED_ITEM_HEIGHT = 48; // Assume same base height but flexible content. Virtualization is tricky with variable height.

export const VirtualStepperList: React.FC<VirtualStepperListProps> = ({
  progress,
  isHovered,
  onPhaseClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // When progress updates (new phase added), scroll to bottom if it's the active one?
  // Or scroll to current phase.
  useEffect(() => {
    const activeIndex = progress.findIndex(p => p.isActive);
    if (activeIndex >= 0 && containerRef.current) {
       // Scroll to keep active item in view
       // But only if we are not manually scrolling?
       // Let's just scroll on mount or when active phase changes
       const targetScroll = Math.max(0, activeIndex * ITEM_HEIGHT - 100); // Keep some context above
       containerRef.current.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  }, [progress.length, progress.find(p => p.isActive)?.phase]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Simple Windowing
  // Only apply windowing if list is long (> 20 items)
  // And only if NOT hovered (because expanded items have variable height)
  // Actually, if hovered, we might want to disable virtualization or just render all if not too many.
  // Requirement says "100+ phases". Rendering 100 simple divs is fine.
  // But let's implement a safe guard.
  
  const shouldVirtualize = progress.length > 30 && !isHovered;
  
  let visibleItems = progress;
  let paddingTop = 0;
  let paddingBottom = 0;

  if (shouldVirtualize) {
      const containerHeight = containerRef.current?.clientHeight || 600;
      const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - 5);
      const endIndex = Math.min(progress.length, Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + 5);
      
      visibleItems = progress.slice(startIndex, endIndex);
      paddingTop = startIndex * ITEM_HEIGHT;
      paddingBottom = (progress.length - endIndex) * ITEM_HEIGHT;
  }

  return (
    <div 
        ref={containerRef}
        className="flex flex-col space-y-4 overflow-y-auto max-h-[80vh] scrollbar-hide px-1"
        onScroll={handleScroll}
    >
      <div style={{ height: paddingTop }} />
      {visibleItems.map((p) => (
        <div
          key={p.phase}
          className={cn(
            "flex items-center cursor-pointer group transition-all duration-200 rounded-md shrink-0", // shrink-0 important
            isHovered ? "gap-3 px-2 py-1 hover:bg-zinc-100/70" : "justify-center h-12" // h-12 matches ITEM_HEIGHT (3rem = 48px)
          )}
          onClick={() => onPhaseClick(p.phase)}
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
      <div style={{ height: paddingBottom }} />
    </div>
  );
};
