'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface AssistantMessageProps {
  content: string;
}

export default function AssistantMessage({ content }: AssistantMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex justify-start mb-6"
    >
      <div className="max-w-[80%] bg-white/90 backdrop-blur-sm text-neutral-1000 px-6 py-4 rounded-3xl rounded-bl-lg shadow-lg shadow-neutral-900/10 border border-neutral-200/50">
        <p className="text-base leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </motion.div>
  );
}
