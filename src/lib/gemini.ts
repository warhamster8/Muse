export const geminiService = {
  async streamChatCompletion(
    apiKey: string,
    messages: any[],
    onChunk: (text: string) => void,
    temperature = 0.7
  ) {
    if (!apiKey) throw new Error('Chiave Gemini mancante');

    const systemInstruction = messages.find((m) => m.role === 'system')?.content || '';
    const chatHistory = messages
      .filter((m) => m.role !== 'system')
      .slice(0, -1)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));
    const lastMessage = messages[messages.length - 1].content;

    // Costruiamo il payload per l'API di Google
    const payload = {
      contents: [...chatHistory, { role: 'user', parts: [{ text: lastMessage }] }],
      system_instruction: systemInstruction
        ? { parts: [{ text: systemInstruction }] }
        : undefined,
      generationConfig: {
        temperature,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    };

    const trimmedKey = apiKey.trim();
    console.log(`[DEBUG] Chiamata Gemini con chiave: ${trimmedKey.substring(0, 4)}...${trimmedKey.slice(-4)}`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${trimmedKey}`;

    const response = await fetch(url, {
      method: 'POST',
      credentials: 'omit',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log(`[DEBUG] Risposta Gemini Status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Errore API Gemini: ${response.status}`);
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
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.substring(6));
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              onChunk(text);
            }
          } catch (e) {
            // Ignoriamo pezzi non validi o meta-dati
          }
        }
      }
    }
  },

  async testConnection(apiKey: string) {
    const trimmedKey = apiKey.trim();
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${trimmedKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'omit',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': trimmedKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Say hi' }] }]
        }),
      });

      const data = await response.json();
      return {
        status: response.status,
        ok: response.ok,
        data,
        headers: Array.from(response.headers.entries())
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
