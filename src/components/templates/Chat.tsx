'use client';

import {
  Conversation,
  ConversationContent
} from "@/components/ai-elements/conversation";
import { Message, MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { FeedbackToolOutput, RecommendationsToolOutput } from '@/lib/intelligence/tool-types';
import { useChat } from "@ai-sdk/react";
import React from 'react';
import styled from 'styled-components';
import { ExperienceTile } from '../molecules/ExperienceTile';
import MessageAssistant from '../molecules/MessageAssistant';
import ChatInputBar from '../organisms/ChatInputBar';
import { ExperienceRecommendations } from '../organisms/ExperienceRecommendations';
import FeedbackForm from '../organisms/FeedbackForm';

interface ChatProps {
  onMessagesChange?: (messageCount: number) => void;
}

const ExperienceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  width: 100%;
  max-height: calc(100vh - 400px);

  @media (max-width: 1200px) {
    gap: 4px;
  }

  @media (max-width: 768px) {
    max-height: calc(100vh - 350px);
  }
`;

const ExperienceTileContainer = styled.div`
  aspect-ratio: 1;
  width: 100%;
  max-height: 100%;
  overflow: hidden;
`;

const experienceImages = [
  {
    url: 'https://d3p3fw3rutb1if.cloudfront.net/photos/acc473bf-d2a0-4192-a53c-53e833937274',
    query: 'Necesito desconectarme del estrés con algo relajante'
  },
  {
    query: 'Quiero aprender a preparar comida japonesa desde cero'
  },
  {
    url: 'https://d3p3fw3rutb1if.cloudfront.net/photos/11b96394-2874-4558-bca2-cf828621730a',
    query: 'Busco una experiencia tranquila y cultural para dos'
  },
  {
    query: 'Organizamos un cumpleaños con algo dulce y especial'
  },
  {
    url: 'https://d3p3fw3rutb1if.cloudfront.net/photos/7e7f14d5-790d-4411-80dd-5834e9894677',
    query: 'Quiero una cita diferente combinando arte y vino'
  },
  {
    query: 'Necesito una actividad de team building para mi equipo'
  },
];

export function Chat({ onMessagesChange }: ChatProps) {
  const { messages, sendMessage, status } = useChat();
  const [isChatDisabled, setIsChatDisabled] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');

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
      setInputValue('');
    }
  }, [isLoading, sendMessage]);

  // Handle tile click - pre-fill input with suggested query
  const handleTileClick = React.useCallback((query: string) => {
    setInputValue(query);
  }, []);

  return (
    <>
      <Conversation>
        <ConversationContent className="p-2 md:p-0">
          {messages.length === 0 ? (
            <Message from="assistant">
              <MessageAssistant>
                Hola! Descubre experiencias increíbles con mi ayuda. Solo escribe qué tipo de actividad buscas y te mostraré las mejores opciones. Qué tienes en mente?
              </MessageAssistant>
              <ExperienceGrid>
                {experienceImages.map((experience, index) => (
                  <ExperienceTileContainer key={index}>
                    <ExperienceTile
                      imageUrl={experience.url}
                      label={!experience.url ? experience.query : undefined}
                      alt={`Experience ${index + 1}`}
                      onClick={() => handleTileClick(experience.query)}
                    />
                  </ExperienceTileContainer>
                ))}
              </ExperienceGrid>
            </Message>
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
                            <MessageAssistant key={`${message.id}-${i}`}>
                              {part.text}
                            </MessageAssistant>
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
                                  <MessageAssistant>
                                    {output.morePeopleSuggestion}
                                  </MessageAssistant>
                                )}
                                {/* Intro message */}
                                {output.introMessage && (
                                  <MessageAssistant>
                                    {output.introMessage}
                                  </MessageAssistant>
                                )}
                                {/* Recommendations carousel */}
                                {output.recommendations && output.recommendations.length > 0 && (
                                  <ExperienceRecommendations recommendations={output.recommendations} />
                                )}
                                {/* Follow-up question */}
                                {output.followUpQuestion && (
                                  <MessageAssistant>
                                    {output.followUpQuestion}
                                  </MessageAssistant>
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
                                  <MessageAssistant>
                                    {output.message}
                                  </MessageAssistant>
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

      <div>
        <div className="p-2 md:p-0 max-w-3xl mx-auto flex flex-col gap-2">
          <ChatInputBar
            isLoading={isLoading}
            messageCount={messages.length}
            onSubmit={handleSubmit}
            disabled={isChatDisabled}
            value={inputValue}
            onInputChange={setInputValue}
          />
          <p className="text-center text-neutral-400 text-xs tracking-tight">
            Momenta está en beta, todo feedback que nos puedas dar es súper valioso para mejorar!
          </p>
        </div>
      </div>
    </>
  );
}
