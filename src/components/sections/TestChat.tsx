'use client';

import React from 'react';
import { useChat } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { MessageResponse } from "@/components/ai-elements/message";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
} from "@/components/ai-elements/tool";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import { ExperienceRecommendations } from '../organisms/ExperienceRecommendations';
import { RecommendationsToolOutput } from '@/lib/intelligence/tool-types';

export function TestChat() {
  const [input, setInput] = React.useState("");
  const { messages, sendMessage, status } = useChat();

  console.log('TestChat messages: ', messages);

  const isLoading = status === 'streaming' || status === 'submitted';

  return (
    <div className="flex flex-col h-screen">
      <Conversation>
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              title="Start a conversation"
              description="Type a message below to begin"
            />
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

      <div className="border-t p-4">
        <PromptInput
          onSubmit={(message, event) => {
            event.preventDefault();
            if (message.text) {
              sendMessage({ text: message.text });
              setInput("");
            }
          }}
          className="max-w-3xl mx-auto flex gap-2 items-end"
        >
          <PromptInputTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            rows={1}
            className="flex-1"
          />
          <PromptInputSubmit disabled={isLoading} />
        </PromptInput>
      </div>
    </div>
  );
}
