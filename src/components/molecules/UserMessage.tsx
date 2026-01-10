'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface UserMessageProps {
  content: string;
}

export default function UserMessage({ content }: UserMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex justify-end mb-6"
    >
      <div className="max-w-[80%] bg-primary-700 text-white px-6 py-4 rounded-3xl rounded-br-lg shadow-lg shadow-primary-700/20">
        <p className="text-base leading-relaxed whitespace-pre-wrap">{content}</p>
      </div>
    </motion.div>
  );
}
