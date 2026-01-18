'use client';

import { Loader } from '@/components/ai-elements/loader';
import {
  PromptInput,
  PromptInputTextarea,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import RotatingPlaceholder from '@/components/atoms/RotatingPlaceholder';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface ChatInputBarProps {
  isLoading: boolean;
  messageCount: number;
  onSubmit: (input: string) => void;
  disabled?: boolean;
}

export default function ChatInputBar({
  isLoading,
  messageCount,
  onSubmit,
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
          'border-2 transition-all duration-300',
          '*:data-[slot=input-group]:rounded-3xl *:data-[slot=input-group]:border-0 *:data-[slot=input-group]:shadow-none min-h-16',
          isFocused
            ? 'border-primary-700'
            : 'border-neutral-300'
        )}
      >
        <PromptInputTextarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder=""
          rows={1}
          disabled={disabled || isLoading}
          className={cn(
            'w-full bg-transparent',
            'text-neutral-1000 text-base md:text-md leading-relaxed',
            'focus:outline-none',
            'resize-none',
            'font-light pl-6 pr-16',
            'field-sizing-content',
            (disabled || isLoading) && 'opacity-50 cursor-not-allowed'
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
          <button
            type="submit"
            disabled={isLoading || disabled}
            className={cn(
              'shrink-0 w-10 h-10 rounded-full',
              'bg-primary-700/40 text-neutral-600',
              'flex items-center justify-center',
              'cursor-pointer',
              'hover:bg-primary-700/60 hover:scale-105',
              'disabled:opacity-30 disabled:cursor-not-allowed',
              'transition-all duration-300',
              'active:scale-95'
            )}
            aria-label="Enviar"
          >
            {isLoading ? (
              <Loader size={16} />
            ) : (
              <Send className="w-4 h-4" strokeWidth={2} />
            )}
          </button>
        </div>
      </PromptInput>
    </motion.div>
  );
}
