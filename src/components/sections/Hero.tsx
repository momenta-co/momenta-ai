'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAIChat, type ChatMessage } from '@/hooks/useAIChat';
import type { AudioVisualizerData, RecommendationData } from '@/types/chat';

// Atoms
import VoiceSphere from '@/components/atoms/VoiceSphere';
import RotatingTitleWord from '@/components/atoms/RotatingTitleWord';
import LoadingMessage from '@/components/atoms/LoadingMessage';

// Molecules
import UserMessage from '@/components/molecules/UserMessage';
import AssistantMessage from '@/components/molecules/AssistantMessage';

// Organisms
import HorizontalSlider from '@/components/organisms/HorizontalSlider';
import ChatInputBar from '@/components/organisms/ChatInputBar';
import ExperienceCarousel from '@/components/organisms/ExperienceCarousel';
import ExperienceCard from '@/components/molecules/ExperienceCard';

export const Hero = () => {
  // Custom AI chat hook - handles all conversation state
  const { messages, input, setInput, handleSubmit, isLoading, error } = useAIChat({
    api: '/api/chat',
  });

  // Log for debugging
  useEffect(() => {
    console.log('[Hero] Messages:', messages);
    console.log('[Hero] Messages count:', messages.length);
    messages.forEach((msg, idx) => {
      console.log(`[Hero] Message ${idx}:`, {
        id: msg.id,
        role: msg.role,
        content: msg.content,
        contentLength: msg.content?.length || 0,
        hasToolInvocations: !!msg.toolInvocations,
        toolInvocationsCount: msg.toolInvocations?.length || 0
      });
    });
    console.log('[Hero] isLoading:', isLoading);
    if (error) console.error('[Hero] Chat error:', error);
  }, [messages, isLoading, error]);

  // UI state
  const [isListening, setIsListening] = useState(false);
  const [audioData, setAudioData] = useState<AudioVisualizerData>({ volume: 0, frequencies: [] });

  // Refs
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>(0);
  const isListeningRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom within the messages container only
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current || !isListeningRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const sum = dataArray.reduce((a, b) => a + b, 0);
    const volume = sum / dataArray.length / 255;

    const frequencies: number[] = [];
    const step = Math.floor(dataArray.length / 32);
    for (let i = 0; i < 32; i++) {
      frequencies.push(dataArray[i * step] / 255);
    }

    setAudioData({ volume, frequencies });

    if (isListeningRef.current) {
      animationFrameRef.current = requestAnimationFrame(analyzeAudio);
    }
  }, []);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      isListeningRef.current = true;
      setIsListening(true);
      analyzeAudio();
    } catch (error) {
      console.error('Microphone access denied:', error);
    }
  };

  const stopListening = () => {
    isListeningRef.current = false;

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    cancelAnimationFrame(animationFrameRef.current);
    setIsListening(false);
    setAudioData({ volume: 0, frequencies: [] });

    // TODO: Implement real voice-to-text
    // For now, voice recording just activates the microphone visualization
    // Users will need to type their message
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Handle form submission
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    handleSubmit(e);
  };

  // Extract recommendations from tool calls in messages - memoized to prevent unnecessary recalculations
  const recommendations = useMemo((): RecommendationData[] | null => {
    console.log('[Hero] Extracting recommendations from messages:', messages);

    // Look for the last message with tool results
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      console.log(`[Hero] Checking message ${i}:`, {
        role: message.role,
        hasToolInvocations: !!message.toolInvocations,
        toolInvocations: message.toolInvocations
      });

      if (message.role === 'assistant' && message.toolInvocations) {
        for (const toolInvocation of message.toolInvocations) {
          console.log('[Hero] Tool invocation:', {
            toolName: toolInvocation.toolName,
            state: toolInvocation.state,
            hasResult: !!toolInvocation.result,
            result: toolInvocation.result
          });

          if (
            toolInvocation.toolName === 'getRecommendations' &&
            toolInvocation.state === 'result' &&
            toolInvocation.result?.success
          ) {
            console.log('[Hero] Found recommendations:', toolInvocation.result.recommendations);
            return toolInvocation.result.recommendations as RecommendationData[];
          }
        }
      }
    }
    console.log('[Hero] No recommendations found');
    return null;
  }, [messages]);

  return (
    <section className="relative h-screen flex flex-col bg-neutral-100 pt-20">
      {/* Two Column Layout - Always Visible */}
      <div className="flex-1 flex items-stretch px-8 lg:px-16 max-w-[1400px] mx-auto w-full h-full py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 w-full h-full">
          {/* Left Column - Chat Interface */}
          <div className="flex flex-col h-full w-full max-h-[83vh]">
            {/* Title and Sphere - Only show when no messages */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center flex-1 gap-8">
                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="text-neutral-1000 leading-[1.25] tracking-tight font-serif font-normal text-center w-full"
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
                  className="text-neutral-1000 leading-[1.25] tracking-tight font-serif font-normal text-center w-full text-small"
                >
                  Cuéntame de qué tienes ganas hoy - Yo me encargo!
                </motion.p>

                {/* 3D Sphere */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 1, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="relative w-72 h-72 -ml-4"
                >
                  <VoiceSphere isListening={isListening} audioData={audioData} />
                </motion.div>
              </div>
            )}

            {/* Chat Messages Area - Scrollable */}
            {messages.length > 0 && (
              <div className="flex-1 overflow-hidden mb-6">
                <div
                  ref={messagesContainerRef}
                  className="h-full overflow-y-auto px-2 custom-scrollbar"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#CBD5E1 transparent'
                  }}
                >
                  {messages.map((message: ChatMessage) => {
                    // Only render user and assistant messages
                    if (message.role === 'user') {
                      return <UserMessage key={message.id} content={message.content} />;
                    }

                    if (message.role === 'assistant') {
                      // Only show assistant message if it has content
                      if (message.content && message.content.trim()) {
                        return <AssistantMessage key={message.id} content={message.content} />;
                      }
                    }

                    return null;
                  })}

                  {/* Loading indicator */}
                  {isLoading && <LoadingMessage />}

                  {/* Error message */}
                  {error && (
                    <div className="flex justify-center mb-4">
                      <div className="bg-red-100 text-red-700 px-4 py-3 rounded-xl">
                        <p className="text-sm">Error: {error.message}</p>
                      </div>
                    </div>
                  )}

                  {/* Show recommendations if available */}
                  {recommendations && recommendations.length > 0 && (
                    <div className="mt-4">
                      <HorizontalSlider
                        title="Experiencias perfectas para ti"
                        items={recommendations}
                        keyExtractor={(rec) => rec.url}
                        renderCard={(rec, index) => (
                          <ExperienceCard
                            recommendation={rec}
                            index={index}
                          />
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chat Input Bar - Always at bottom of left column */}
            <ChatInputBar
              input={input}
              setInput={setInput}
              isLoading={isLoading}
              isListening={isListening}
              onSubmit={onSubmit}
              toggleVoice={toggleVoice}
            />
          </div>

          {/* Right Column - Featured Experience Carousel */}
          <ExperienceCarousel />
        </div>
      </div>
    </section>
  );
}
