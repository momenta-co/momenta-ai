import { useState, useCallback } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolInvocations?: any[];
}

export interface UseAIChatOptions {
  api: string;
  initialMessages?: ChatMessage[];
}

export function useAIChat({ api, initialMessages = [] }: UseAIChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      if (!input.trim() || isLoading) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: input.trim(),
      };

      // Add user message immediately
      setMessages((prev) => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(api, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        let assistantMessageContent = '';
        const assistantMessageId = `assistant-${Date.now()}`;
        let toolInvocations: any[] = [];

        // Add empty assistant message
        setMessages((prev) => [
          ...prev,
          {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
          },
        ]);

        let buffer = '';
        // Track tool calls by ID to match with results
        const toolCallsMap: Record<string, any> = {};

        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          const lines = buffer.split('\n');

          // Keep the last incomplete line in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;

            console.log('[useAIChat] Raw stream line:', line);

            try {
              // Handle SSE format: "data: {...}"
              let jsonData: any;

              if (line.startsWith('data: ')) {
                const jsonStr = line.slice(6); // Remove "data: " prefix

                // Skip special markers
                if (jsonStr === '[DONE]') continue;

                jsonData = JSON.parse(jsonStr);
                console.log('[useAIChat] Parsed SSE data:', jsonData);
              }
              // AI SDK v6 text stream format: "0:" prefix for text deltas (fallback)
              else if (line.startsWith('0:')) {
                const jsonStr = line.slice(2);
                const content = JSON.parse(jsonStr);
                console.log('[useAIChat] Parsed text content:', content);

                if (typeof content === 'string') {
                  assistantMessageContent += content;
                  console.log('[useAIChat] Added string content, total length:', assistantMessageContent.length);
                } else if (content && typeof content === 'object' && content.text) {
                  assistantMessageContent += content.text;
                  console.log('[useAIChat] Added object.text content, total length:', assistantMessageContent.length);
                }

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: assistantMessageContent }
                      : msg
                  )
                );
                continue;
              }

              // Process SSE data based on type
              if (jsonData) {
                // Handle text deltas
                if (jsonData.type === 'text-delta' && jsonData.delta) {
                  assistantMessageContent += jsonData.delta;
                  console.log('[useAIChat] Added text delta, total length:', assistantMessageContent.length);

                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, content: assistantMessageContent }
                        : msg
                    )
                  );
                }
                // Handle tool input start - AI SDK format
                else if (jsonData.type === 'tool-input-start') {
                  console.log('[useAIChat] Tool input start:', jsonData);

                  const toolCallId = jsonData.toolCallId;
                  if (toolCallId) {
                    toolCallsMap[toolCallId] = {
                      toolCallId: toolCallId,
                      toolName: jsonData.toolName,
                      args: {},
                      state: 'call',
                    };

                    toolInvocations = Object.values(toolCallsMap);
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? { ...msg, toolInvocations: [...toolInvocations] }
                          : msg
                      )
                    );
                  }
                }
                // Handle tool input available - AI SDK format
                else if (jsonData.type === 'tool-input-available') {
                  console.log('[useAIChat] Tool input available:', jsonData);

                  const toolCallId = jsonData.toolCallId;
                  if (toolCallId && toolCallsMap[toolCallId]) {
                    toolCallsMap[toolCallId] = {
                      ...toolCallsMap[toolCallId],
                      args: jsonData.input || jsonData.args,
                    };

                    toolInvocations = Object.values(toolCallsMap);
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? { ...msg, toolInvocations: [...toolInvocations] }
                          : msg
                      )
                    );
                  }
                }
                // Handle tool result - AI SDK format
                else if (jsonData.type === 'tool-result' || jsonData.type === 'tool-output-available') {
                  console.log('[useAIChat] Tool result/output:', jsonData);

                  const toolCallId = jsonData.toolCallId;
                  if (toolCallId && toolCallsMap[toolCallId]) {
                    toolCallsMap[toolCallId] = {
                      ...toolCallsMap[toolCallId],
                      state: 'result',
                      result: jsonData.output || jsonData.result,
                    };

                    toolInvocations = Object.values(toolCallsMap);
                    console.log('[useAIChat] Updated tool invocations:', toolInvocations);

                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessageId
                          ? { ...msg, toolInvocations: [...toolInvocations] }
                          : msg
                      )
                    );
                  }
                }
              }
              // AI SDK v6: Tool call - "9:" prefix (fallback)
              else if (line.startsWith('9:')) {
                const toolCall = JSON.parse(line.slice(2));
                console.log('Tool call:', toolCall);

                // Store tool call by ID
                if (toolCall.toolCallId) {
                  toolCallsMap[toolCall.toolCallId] = {
                    toolCallId: toolCall.toolCallId,
                    toolName: toolCall.toolName,
                    args: toolCall.args,
                    state: 'call',
                  };

                  // Update invocations
                  toolInvocations = Object.values(toolCallsMap);
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, toolInvocations: [...toolInvocations] }
                        : msg
                    )
                  );
                }
              }
              // AI SDK v6: Tool result - "a:" prefix
              else if (line.startsWith('a:')) {
                const toolResult = JSON.parse(line.slice(2));
                console.log('Tool result:', toolResult);

                // Match result with call by ID
                if (toolResult.toolCallId && toolCallsMap[toolResult.toolCallId]) {
                  toolCallsMap[toolResult.toolCallId] = {
                    ...toolCallsMap[toolResult.toolCallId],
                    state: 'result',
                    result: toolResult.result,
                  };

                  // Update invocations
                  toolInvocations = Object.values(toolCallsMap);
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === assistantMessageId
                        ? { ...msg, toolInvocations: [...toolInvocations] }
                        : msg
                    )
                  );
                }
              }
              // Handle other formats or plain text
              else if (!line.startsWith('data:') && !line.match(/^[0-9a-f]:/) ) {
                assistantMessageContent += line;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: assistantMessageContent }
                      : msg
                  )
                );
              }
            } catch (e) {
              console.error('Failed to parse line:', line, e);
            }
          }
        }

        // Process any remaining buffer
        if (buffer.trim()) {
          try {
            if (buffer.startsWith('0:')) {
              const content = JSON.parse(buffer.slice(2));
              if (typeof content === 'string') {
                assistantMessageContent += content;
              }
            } else {
              assistantMessageContent += buffer;
            }

            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: assistantMessageContent }
                  : msg
              )
            );
          } catch (e) {
            console.error('Failed to parse remaining buffer:', buffer, e);
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Chat error:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setIsLoading(false);
      }
    },
    [api, input, messages, isLoading]
  );

  return {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error,
  };
}
