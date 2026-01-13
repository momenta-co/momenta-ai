'use client';

import {
  Conversation,
  ConversationContent
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
} from "@/components/ai-elements/tool";
import { RecommendationsToolOutput } from '@/lib/intelligence/tool-types';
import { useChat } from "@ai-sdk/react";
import { motion } from 'framer-motion';
import React from 'react';
import RotatingTitleWord from '../atoms/RotatingTitleWord';
import VoiceSphere from '../atoms/VoiceSphere';
import { ExperienceRecommendations } from '../organisms/ExperienceRecommendations';
import ChatInputBar from '../organisms/ChatInputBar';

interface ChatProps {
  onMessagesChange?: (messageCount: number) => void;
}

export function Chat({ onMessagesChange }: ChatProps) {
  const [input, setInput] = React.useState("");
  const { messages, sendMessage, status, stop } = useChat();

  console.log('Chat messages: ', messages);

  const isLoading = status === 'streaming' || status === 'submitted';

  // Notify parent when messages change
  React.useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages.length);
    }
  }, [messages.length, onMessagesChange]);

  // Handle submit from ChatInputBar
  const handleSubmit = React.useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage({ text: input });
      setInput("");
    }
  }, [input, isLoading, sendMessage]);

  // Handle stop button click
  const handleStop = React.useCallback(() => {
    stop?.();
  }, [stop]);

  return (
    <>
      <Conversation>
        <ConversationContent className="h-full w-full p-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-between flex-1">
              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-neutral-1000 leading-tight tracking-tight font-serif font-normal text-center w-full"
                style={{ fontSize: 'clamp(2rem, 5vw, 40px)' }}
              >
                La manera más{' '}<RotatingTitleWord />
                <br />
                de vivir tu tiempo libre
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-neutral-1000 leading-tight tracking-tight font-serif font-normal text-center w-full text-small"
              >
                Cuéntame qué experiencia buscas - Yo te recomiendo!
              </motion.p>

              {/* 3D Sphere */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative w-72 h-72 -ml-4"
              >
                <VoiceSphere />
              </motion.div>
            </div>
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.role === "assistant"
                    ? (() => {
                      // Check if there's a successful getRecommendations tool call
                      // If so, we'll skip text parts that come after it (they duplicate the carousel)
                      const hasSuccessfulRecommendations = message.parts?.some(
                        (p) => p.type === "tool-getRecommendations" &&
                          p.state === "output-available" &&
                          p.output
                      );
                      const recommendationsIndex = message.parts?.findIndex(
                        (p) => p.type === "tool-getRecommendations"
                      ) ?? -1;

                      return message.parts?.map((part, i) => {
                        switch (part.type) {
                          case "text":
                            // Skip text parts that come after a successful recommendations tool
                            // (they duplicate the intro/followUp that's already in the tool output)
                            if (hasSuccessfulRecommendations && i > recommendationsIndex) {
                              return null;
                            }
                            return (
                              <MessageResponse key={`${message.id}-${i}`}>
                                {part.text}
                              </MessageResponse>
                            );
                          case "tool-getRecommendations": {
                            const output = part.output as RecommendationsToolOutput | undefined;

                            // Show progressive loading states from generator
                            if (output?.status === 'loading') {
                              return (
                                <Tool key={part.toolCallId || `${message.id}-${i}`}>
                                  <ToolHeader type={part.type} state={part.state} />
                                  <ToolContent>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <span className="animate-pulse">●</span>
                                      <span>{output.message}</span>
                                    </div>
                                  </ToolContent>
                                </Tool>
                              );
                            }

                            // Show error state
                            if (output?.status === 'error') {
                              return (
                                <Tool key={part.toolCallId || `${message.id}-${i}`}>
                                  <ToolHeader type={part.type} state="output-error" />
                                  <ToolContent>
                                    <div className="text-destructive">
                                      {output.error || 'Error generando recomendaciones'}
                                    </div>
                                  </ToolContent>
                                </Tool>
                              );
                            }

                            // Show final success state with recommendations
                            if (part.state === "output-available" && output?.status === 'success') {
                              return (
                                <div key={part.toolCallId || `${message.id}-${i}`} className="space-y-4">
                                  {/* More people suggestion */}
                                  {output.morePeopleSuggestion && (
                                    <MessageResponse>
                                      {output.morePeopleSuggestion}
                                    </MessageResponse>
                                  )}
                                  {/* Intro message */}
                                  {output.introMessage && (
                                    <MessageResponse>
                                      {output.introMessage}
                                    </MessageResponse>
                                  )}
                                  {/* Recommendations carousel */}
                                  {output.recommendations && output.recommendations.length > 0 && (
                                    <ExperienceRecommendations recommendations={output.recommendations} />
                                  )}
                                  {/* Follow-up question */}
                                  {output.followUpQuestion && (
                                    <MessageResponse>
                                      {output.followUpQuestion}
                                    </MessageResponse>
                                  )}
                                </div>
                              );
                            }

                            // Fallback: Show generic loading state while tool is initializing
                            return (
                              <Tool key={part.toolCallId || `${message.id}-${i}`}>
                                <ToolHeader type={part.type} state={part.state} />
                                <ToolContent>
                                  <ToolInput input={part.input} />
                                </ToolContent>
                              </Tool>
                            );
                          }
                          default:
                            return null;
                        }
                      });
                    })()
                    : message.parts?.map(
                      (part) => part.type === "text" && part.text
                    )}
                </MessageContent>
              </Message>
            ))
          )}
        </ConversationContent>
      </Conversation>

      <div>
        <div className="max-w-3xl mx-auto">
          <ChatInputBar
            input={input}
            setInput={setInput}
            isLoading={isLoading}
            messageCount={messages.length}
            onSubmit={handleSubmit}
            onStop={handleStop}
          />
        </div>
      </div>
    </>
  );
}
