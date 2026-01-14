'use client';

import {
  PromptInput,
  PromptInputButton,
  PromptInputTextarea,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import RotatingPlaceholder from '@/components/atoms/RotatingPlaceholder';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Loader2, Send, Square } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface ChatInputBarProps {
  isLoading: boolean;
  messageCount: number;
  onSubmit: (input: string) => void;
  onStop?: () => void;
  disabled?: boolean;
}

export default function ChatInputBar({
  isLoading,
  messageCount,
  onSubmit,
  onStop,
  disabled = false,
}: ChatInputBarProps) {
  const [input, setInput] = useState('');
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
      event.preventDefault();
      if (message.text.trim() && !isLoading && !disabled) {
        onSubmit(message.text);
        setInput('');
        // Hide keyboard on mobile after submit
        textareaRef.current?.blur();
      }
    },
    [isLoading, onSubmit, disabled]
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
          'relative bg-white/95 backdrop-blur-xl rounded-3xl',
          'border transition-all duration-500',
          '*:data-[slot=input-group]:rounded-3xl *:data-[slot=input-group]:border-0 *:data-[slot=input-group]:shadow-none min-h-16',
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
        <PromptInputTextarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder=""
          rows={1}
          disabled={disabled}
          className={cn(
            'w-full bg-transparent',
            'text-neutral-1000 text-base md:text-md leading-relaxed',
            'focus:outline-none',
            'resize-none',
            'font-light pl-6 pr-16',
            'field-sizing-content',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        {/* Rotating placeholder overlay */}
        {messageCount === 0 && !input && !isFocused && (
          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 pointer-events-none max-w-[80%]">
            <RotatingPlaceholder />
          </div>
        )}
        {/* Absolutely positioned submit button */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading && onStop ? (
            <PromptInputButton
              onClick={handleStop}
              className={cn(
                'shrink-0 w-11 h-11 rounded-full',
                'bg-red-100 text-red-600',
                'flex items-center justify-center',
                'cursor-pointer',
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
              disabled={!input.trim() || isLoading || disabled}
              className={cn(
                'shrink-0 w-11 h-11 rounded-full',
                'bg-neutral-300/80 text-neutral-600',
                'flex items-center justify-center',
                'cursor-pointer',
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
        </div>
      </PromptInput>
    </motion.div>
  );
}
