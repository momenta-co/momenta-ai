'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function LoadingMessage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex justify-start mb-6"
    >
      <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-3xl rounded-bl-lg shadow-lg shadow-neutral-900/10 border border-neutral-200/50">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2.5 h-2.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2.5 h-2.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </motion.div>
  );
}
