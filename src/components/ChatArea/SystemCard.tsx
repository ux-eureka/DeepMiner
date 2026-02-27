import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface SystemCardProps {
  content: string;
  phase?: string;
  type?: 'system' | 'system_warning';
  data?: {
      title: string;
      questions: string[];
  };
}

export const SystemCard: React.FC<SystemCardProps> = ({ content, phase, type = 'system', data }) => {
  const isWarning = type === 'system_warning';

  return (
    <motion.div 
      id={phase ? `phase-${phase}` : undefined}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full mb-6 scroll-mt-24"
    >
      {data ? (
        <div className="bg-white border border-zinc-200 rounded-lg shadow-sm p-5">
          <div className="flex items-center mb-4 pb-3 border-b border-zinc-100">
            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded mr-2 uppercase tracking-wide">
              Phase {phase}
            </span>
            <h3 className="text-base font-bold text-zinc-800">{data.title}</h3>
          </div>
          <div className="space-y-3">
            {data.questions.map((q, idx) => (
              <div key={idx} className="flex items-start">
                <span className="text-slate-400 text-xs font-medium mr-2 mt-0.5 min-w-[24px]">
                  {phase}.{idx + 1}
                </span>
                <p className="text-sm text-zinc-700 leading-relaxed font-medium">
                  {q.replace(/^\d+\.\d+\s*/, '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'border rounded-lg shadow-sm p-4',
            isWarning ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-zinc-200 text-zinc-700'
          )}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{content}</p>
        </div>
      )}
    </motion.div>
  );
};
