export const deepseekService = {
  async streamChatCompletion(
    apiKey: string,
    messages: any[],
    onChunk: (text: string) => void,
    temperature = 0.7
  ) {
    if (!apiKey) throw new Error('Chiave DeepSeek mancante');

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Errore DeepSeek: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Impossibile leggere lo stream di risposta');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

        if (trimmedLine.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmedLine.substring(6));
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch (e) {
            // Ignoriamo pezzi di JSON incompleti o non validi
          }
        }
      }
    }
  },

  async testConnection(apiKey: string) {
    try {
      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'hi' }],
          max_tokens: 5
        }),
      });

      const data = await response.json();
      return {
        status: response.status,
        ok: response.ok,
        data
      };
    } catch (err: any) {
      return {
        status: 0,
        ok: false,
        error: err.message
      };
    }
  }
};
