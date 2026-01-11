'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import RotatingPlaceholder from '@/components/atoms/RotatingPlaceholder';

interface ChatInputBarProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function ChatInputBar({
  input,
  setInput,
  isLoading,
  onSubmit,
}: ChatInputBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <motion.form
      onSubmit={onSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="w-full"
    >
      <div
        className={`
          bg-white/95 backdrop-blur-xl rounded-3xl
          border transition-all duration-500
          ${isFocused
            ? 'border-primary-700/40 shadow-2xl shadow-primary-700/20 scale-[1.01]'
            : 'border-neutral-300/50 shadow-xl shadow-neutral-900/8'
          }
        `}
        style={{
          boxShadow: isFocused
            ? '0 20px 60px -15px rgba(30, 58, 95, 0.25), 0 10px 30px -10px rgba(30, 58, 95, 0.15)'
            : '0 15px 45px -10px rgba(31, 41, 55, 0.12), 0 8px 20px -5px rgba(31, 41, 55, 0.08)',
        }}
      >
        {/* Textarea row */}
        <div className="relative px-6 pt-5 pb-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Auto-resize textarea dynamically
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim() && !isLoading) {
                  onSubmit(e as any);
                }
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            rows={1}
            className="
              w-full bg-transparent
              text-neutral-1000 text-base leading-relaxed
              focus:outline-none
              resize-none overflow-hidden
              font-light min-h-[28px]
            "
          />
          {/* Rotating placeholder overlay */}
          {!input && !isFocused && (
            <div className="absolute inset-x-6 top-5 pointer-events-none">
              <RotatingPlaceholder />
            </div>
          )}
        </div>

        {/* Buttons row */}
        <div className="flex items-center justify-end gap-3 px-4 pb-3">
          {/* Send button */}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="
              flex-shrink-0 w-11 h-11 rounded-full
              bg-neutral-300/80 text-neutral-600
              flex items-center justify-center
              hover:bg-neutral-400/80 hover:scale-105
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all duration-300
              active:scale-95
            "
            aria-label="Enviar"
          >
            <Send className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      </div>
    </motion.form>
  );
}
