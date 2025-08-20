import { useState, useCallback } from 'react';

interface ChatCompletionOptions {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  stream?: boolean;
  noteContent?: string;
  context?: string;
  selection?: string;
  editMode?: boolean;
  onChunk?: (chunk: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
}

export function useNoteChatCompletion() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [controller, setController] = useState<AbortController | null>(null);

  const sendMessage = useCallback(async (options: ChatCompletionOptions) => {
    const {
      messages,
      model = 'gpt-4o-mini',
      stream = true,
      noteContent,
      context,
      selection,
      editMode = false,
      onChunk,
      onComplete,
      onError
    } = options;

    setIsLoading(true);
    setError(null);

    const abortController = new AbortController();
    setController(abortController);

    try {
      const response = await fetch('/api/notes/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model,
          stream,
          noteContent,
          context,
          selection,
          editMode
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response');
      }

      if (stream && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                
                if (data === '[DONE]') {
                  onComplete?.(fullText);
                  break;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  
                  if (content) {
                    fullText += content;
                    onChunk?.(content);
                  }
                } catch (e) {
                  // Skip invalid JSON lines
                  console.debug('Skipping invalid JSON:', data);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        // Non-streaming response
        const data = await response.json();
        const content = data.content || '';
        onComplete?.(content);
      }
    } catch (err) {
      const error = err as Error;
      
      if (error.name !== 'AbortError') {
        setError(error);
        onError?.(error);
      }
    } finally {
      setIsLoading(false);
      setController(null);
    }
  }, []);

  const abort = useCallback(() => {
    if (controller) {
      controller.abort();
      setController(null);
      setIsLoading(false);
    }
  }, [controller]);

  return {
    sendMessage,
    abort,
    isLoading,
    error
  };
}