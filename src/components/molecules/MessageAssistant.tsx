'use client';

import { MessageResponse } from '@/components/ai-elements/message';
import Image from 'next/image';
import React from 'react';

interface MessageAssistantProps {
  children: string;
  className?: string;
}

export default function MessageAssistant({ children, className }: MessageAssistantProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Avatar and Name */}
      <div className="flex items-center gap-2">
        <Image
          src="/favicon.ico"
          alt="Momenta"
          width={24}
          height={24}
          className="rounded-full"
        />
        <span className="text-sm font-medium text-neutral-1000">Momenta</span>
      </div>

      {/* Message Content */}
      <MessageResponse className={`bg-secondary/50 rounded-2xl rounded-bl-none w-fit px-4 py-3 ${className || ''}`}>
        {children}
      </MessageResponse>
    </div>
  );
}
