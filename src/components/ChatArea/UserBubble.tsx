import React from 'react';
import { motion } from 'framer-motion';

interface UserBubbleProps {
  content: string;
}

export const UserBubble: React.FC<UserBubbleProps> = ({ content }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex justify-end w-full mb-6"
    >
      <div className="bg-slate-700 text-white rounded-2xl rounded-tr-sm px-5 py-3 shadow-md max-w-[70%]">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </motion.div>
  );
};
