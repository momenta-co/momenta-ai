'use client';

import {
  Conversation,
  ConversationContent
} from "@/components/ai-elements/conversation";
import { Message, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { FeedbackToolOutput, RecommendationsToolOutput } from '@/lib/intelligence/tool-types';
import { useChat } from "@ai-sdk/react";
import { motion } from 'framer-motion';
import React from 'react';
import RotatingTitleWord from '../atoms/RotatingTitleWord';
import VoiceSphere from '../atoms/VoiceSphere';
import ChatInputBar from '../organisms/ChatInputBar';
import { ExperienceRecommendations } from '../organisms/ExperienceRecommendations';
import FeedbackForm from '../organisms/FeedbackForm';

interface ChatProps {
  onMessagesChange?: (messageCount: number) => void;
}

export function Chat({ onMessagesChange }: ChatProps) {
  const { messages, sendMessage, status } = useChat();
  const [isChatDisabled, setIsChatDisabled] = React.useState(false);

  console.log('Chat messages: ', messages);

  const isLoading = status === 'streaming' || status === 'submitted';

  // Notify parent when messages change
  React.useEffect(() => {
    if (onMessagesChange) {
      onMessagesChange(messages.length);
    }
  }, [messages.length, onMessagesChange]);

  // Handle submit from ChatInputBar
  const handleSubmit = React.useCallback((input: string) => {
    if (input.trim() && !isLoading) {
      sendMessage({ text: input });
    }
  }, [isLoading, sendMessage]);

  return (
    <>
      <Conversation>
        <ConversationContent className={messages.length === 0 ? "h-full justify-center" : ""}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-6 lg:gap-8">
              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="text-neutral-1000 leading-tight tracking-tighter font-serif font-normal text-center w-full"
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
                className="text-neutral-1000 leading-tight tracking-tighter font-serif font-normal text-center w-full text-lg max-w-[70%] lg:max-w-full"
              >
                Descubre experiencias increíbles con mi ayuda. Solo escribe qué tipo de actividad buscas y te mostraré las mejores opciones!
              </motion.p>

              <div className="p-2 md:p-0 w-full mx-auto flex flex-col gap-2">
                <ChatInputBar
                  isLoading={isLoading}
                  messageCount={messages.length}
                  onSubmit={handleSubmit}
                  disabled={isChatDisabled}
                />
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
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

                    // Check if there's a successful requestFeedback tool call
                    // If so, we'll skip text parts that come after it (they duplicate the message)
                    const hasSuccessfulFeedback = message.parts?.some(
                      (p) => p.type === "tool-requestFeedback" &&
                        p.state === "output-available" &&
                        (p.output as FeedbackToolOutput | undefined)?.success
                    );
                    const feedbackIndex = message.parts?.findIndex(
                      (p) => p.type === "tool-requestFeedback"
                    ) ?? -1;

                    return message.parts?.map((part, i) => {
                      switch (part.type) {
                        case "text":
                          // Skip text parts that come after a successful recommendations tool
                          // (they duplicate the intro/followUp that's already in the tool output)
                          if (hasSuccessfulRecommendations && i > recommendationsIndex) {
                            return null;
                          }
                          // Skip text parts that come after a successful feedback tool
                          // (they duplicate the message that's already in the tool output)
                          if (hasSuccessfulFeedback && i > feedbackIndex) {
                            return null;
                          }
                          return (
                            <MessageResponse key={`${message.id}-${i}`} className="bg-secondary/50 rounded-2xl rounded-bl-none w-fit px-4 py-3">
                              {part.text}
                            </MessageResponse>
                          );
                        case "tool-getRecommendations": {
                          const output = part.output as RecommendationsToolOutput | undefined;

                          // Show progressive loading states from generator
                          if (output?.status === 'loading') {
                            return (
                              <div key={part.toolCallId || `${message.id}-${i}`} className="py-2">
                                <Shimmer className="text-md">Descubriendo experiencias increíbles para ti...</Shimmer>
                              </div>
                            );
                          }

                          // Show error state
                          if (output?.status === 'error') {
                            return (
                              <div key={part.toolCallId || `${message.id}-${i}`} className="text-destructive py-2">
                                {output.error || 'Error generando recomendaciones'}
                              </div>
                            );
                          }

                          // Show final success state with recommendations
                          if (part.state === "output-available" && output?.status === 'success') {
                            return (
                              <div key={part.toolCallId || `${message.id}-${i}`} className="space-y-4">
                                {/* More people suggestion */}
                                {output.morePeopleSuggestion && (
                                  <MessageResponse className="bg-secondary/50 rounded-2xl rounded-bl-none w-fit px-4 py-3">
                                    {output.morePeopleSuggestion}
                                  </MessageResponse>
                                )}
                                {/* Intro message */}
                                {output.introMessage && (
                                  <MessageResponse className="bg-secondary/50 rounded-2xl rounded-bl-none w-fit px-4 py-3">
                                    {output.introMessage}
                                  </MessageResponse>
                                )}
                                {/* Recommendations carousel */}
                                {output.recommendations && output.recommendations.length > 0 && (
                                  <ExperienceRecommendations recommendations={output.recommendations} />
                                )}
                                {/* Follow-up question */}
                                {output.followUpQuestion && (
                                  <MessageResponse className="bg-secondary/50 rounded-2xl rounded-bl-none w-fit px-4 py-3">
                                    {output.followUpQuestion}
                                  </MessageResponse>
                                )}
                              </div>
                            );
                          }

                          // Fallback: Show generic loading state while tool is initializing
                          return (
                            <div key={part.toolCallId || `${message.id}-${i}`} className="py-2">
                              <Shimmer className="text-md">Preparando recomendaciones para ti...</Shimmer>
                            </div>
                          );
                        }

                        case "tool-requestFeedback": {
                          const output = part.output as FeedbackToolOutput | undefined;

                          // Show feedback form when tool succeeds
                          if (part.state === "output-available" && output?.success && output.showFeedbackForm) {
                            return (
                              <div key={part.toolCallId || `${message.id}-${i}`} className="space-y-4">
                                {/* Context message from LLM */}
                                {output.message && (
                                  <MessageResponse className="bg-secondary/50 rounded-2xl rounded-bl-none w-fit px-4 py-3">
                                    {output.message}
                                  </MessageResponse>
                                )}
                                {/* Feedback form */}
                                <FeedbackForm
                                  messageId={message.id}
                                  recommendationIds={output.context?.recommendationIds}
                                  userSentiment={output.context?.userSentiment}
                                  chatLogs={messages}
                                  onSubmitSuccess={() => {
                                    console.log('[Chat] Feedback submitted successfully');
                                    setIsChatDisabled(true);
                                  }}
                                />
                              </div>
                            );
                          }

                          // Fallback: Show generic loading state
                          return (
                            <div key={part.toolCallId || `${message.id}-${i}`} className="py-2">
                              <Shimmer className="text-md">Creando momentos memorables...</Shimmer>
                            </div>
                          );
                        }

                        default:
                          return null;
                      }
                    });
                  })()
                  : message.parts?.map((part, i) =>
                    part.type === "text" && (
                      <MessageResponse key={`${message.id}-${i}`} className="bg-primary-800 rounded-2xl rounded-br-none w-fit ml-auto px-4 py-3 max-w-[70%]">
                        {part.text}
                      </MessageResponse>
                    )
                  )}
              </Message>
            ))
          )}
        </ConversationContent>
      </Conversation>

      {/* Chat Input Bar */}
      {messages.length > 0 && (
        <div>
          <div className="p-2 md:p-0 max-w-3xl mx-auto flex flex-col gap-2">
            <ChatInputBar
              isLoading={isLoading}
              messageCount={messages.length}
              onSubmit={handleSubmit}
              disabled={isChatDisabled}
            />
            <p className="text-center text-neutral-400 text-xs tracking-tight">
              Momenta está en beta, todo feedback que nos puedas dar es súper valioso para mejorar!
            </p>
          </div>
        </div>
      )}
    </>
  );
}
