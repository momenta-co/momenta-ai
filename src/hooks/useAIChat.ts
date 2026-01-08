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

            console.log('Raw stream line:', line);

            try {
              // AI SDK v6 text stream format: "0:" prefix for text deltas
              if (line.startsWith('0:')) {
                const jsonStr = line.slice(2);
                const content = JSON.parse(jsonStr);
                console.log('Parsed content:', content);

                if (typeof content === 'string') {
                  assistantMessageContent += content;
                } else if (content && typeof content === 'object' && content.text) {
                  // Handle object format {text: "..."}
                  assistantMessageContent += content.text;
                }

                // Update the assistant message
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: assistantMessageContent }
                      : msg
                  )
                );
              }
              // Tool call/result format
              else if (line.startsWith('9:')) {
                const toolData = JSON.parse(line.slice(2));
                console.log('Tool data:', toolData);
                toolInvocations.push(toolData);

                // Update message with tool invocations
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, toolInvocations: [...toolInvocations] }
                      : msg
                  )
                );
              }
              // Handle plain text lines (fallback)
              else if (!line.startsWith('data:') && !line.includes(':')) {
                console.log('Plain text line:', line);
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
              // Try treating it as plain text
              if (!line.startsWith('0:') && !line.startsWith('9:')) {
                assistantMessageContent += line;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: assistantMessageContent }
                      : msg
                  )
                );
              }
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
