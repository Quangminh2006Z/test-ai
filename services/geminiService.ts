export const hasApiKey = (): boolean => !!(import.meta.env.VITE_API_URL || 'https://test-ai-1-kfrc.onrender.com');

export const initializeChat = async (): Promise<boolean> => {
  if (!hasApiKey()) {
    return false;
  }

  return true;
};

const getApiBaseUrl = (): string => {
  const configured = import.meta.env.VITE_API_URL || 'https://test-ai-1-kfrc.onrender.com';
  return configured.replace(/\/$/, '');
};

export interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export const sendMessageStream = async (
  message: string,
  images?: string[],
  history: ChatHistoryItem[] = []
): Promise<AsyncIterable<string>> => {
  const baseUrl = getApiBaseUrl();

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      images: images || [],
      history,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to call backend AI API');
  }

  if (!response.body) {
    throw new Error('No response body stream received');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  async function* streamGenerator() {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      if (text) {
        yield text;
      }
    }
  }

  return streamGenerator();
};

export const resetChat = () => {
  // no-op: chat state is managed by server-side backend
};