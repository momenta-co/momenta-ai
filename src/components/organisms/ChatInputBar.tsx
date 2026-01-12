'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Square } from 'lucide-react';
import RotatingPlaceholder from '@/components/atoms/RotatingPlaceholder';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputButton,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import { cn } from '@/lib/utils';

interface ChatInputBarProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onStop?: () => void;
}

export default function ChatInputBar({
  input,
  setInput,
  isLoading,
  onSubmit,
  onStop,
}: ChatInputBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus when loading stops
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  // Handle submit from PromptInput - adapt to parent's interface
  const handleSubmit = useCallback(
    (message: PromptInputMessage, event: React.FormEvent<HTMLFormElement>) => {
      if (message.text.trim() && !isLoading) {
        onSubmit(event);
      }
    },
    [isLoading, onSubmit]
  );

  // Handle stop button click
  const handleStop = useCallback(() => {
    onStop?.();
  }, [onStop]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="w-full"
    >
      <PromptInput
        onSubmit={handleSubmit}
        className={cn(
          'bg-white/95 backdrop-blur-xl rounded-3xl',
          'border transition-all duration-500',
          '[&>[data-slot=input-group]]:rounded-3xl [&>[data-slot=input-group]]:border-0 [&>[data-slot=input-group]]:shadow-none',
          isFocused
            ? 'border-primary-700/40 shadow-2xl shadow-primary-700/20 scale-[1.01]'
            : 'border-neutral-300/50 shadow-xl shadow-neutral-900/8'
        )}
        style={{
          boxShadow: isFocused
            ? '0 20px 60px -15px rgba(30, 58, 95, 0.25), 0 10px 30px -10px rgba(30, 58, 95, 0.15)'
            : '0 15px 45px -10px rgba(31, 41, 55, 0.12), 0 8px 20px -5px rgba(31, 41, 55, 0.08)',
        }}
      >
        {/* Textarea with rotating placeholder */}
        <div className="relative w-full">
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder=""
            className={cn(
              'w-full bg-transparent',
              'text-neutral-1000 text-base leading-relaxed',
              'focus:outline-none',
              'resize-none',
              'font-light min-h-[28px] py-5 px-6',
              'field-sizing-content max-h-48'
            )}
          />
          {/* Rotating placeholder overlay */}
          {!input && !isFocused && (
            <div className="absolute inset-x-6 top-5 pointer-events-none">
              <RotatingPlaceholder />
            </div>
          )}
        </div>

        {/* Footer with submit button */}
        <PromptInputFooter className="px-4 pb-3 pt-0 border-0">
          <PromptInputTools>
            {/* Spacer to push button to the right */}
          </PromptInputTools>
          <PromptInputTools>
            {isLoading && onStop ? (
              <PromptInputButton
                onClick={handleStop}
                className={cn(
                  'flex-shrink-0 w-11 h-11 rounded-full',
                  'bg-red-100 text-red-600',
                  'flex items-center justify-center',
                  'hover:bg-red-200 hover:scale-105',
                  'transition-all duration-300',
                  'active:scale-95'
                )}
                aria-label="Detener"
              >
                <Square className="w-4 h-4" strokeWidth={2} />
              </PromptInputButton>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={cn(
                  'flex-shrink-0 w-11 h-11 rounded-full',
                  'bg-neutral-300/80 text-neutral-600',
                  'flex items-center justify-center',
                  'hover:bg-neutral-400/80 hover:scale-105',
                  'disabled:opacity-30 disabled:cursor-not-allowed',
                  'transition-all duration-300',
                  'active:scale-95'
                )}
                aria-label="Enviar"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Send className="w-4 h-4" strokeWidth={2} />
                )}
              </button>
            )}
          </PromptInputTools>
        </PromptInputFooter>
      </PromptInput>
    </motion.div>
  );
}
