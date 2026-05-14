/**
 * Servizio per l'interazione con l'API di Google Gemini.
 * Gestisce lo streaming e la diagnostica di connessione tramite REST nativo.
 */
const envKey = import.meta.env.VITE_GEMINI_API_KEY;

export const geminiService = {
  /**
   * Avvia una chat completion in streaming.
   * 
   * @param apiKey - Chiave API Google AI Studio
   * @param messages - Cronologia messaggi {role, content}
   * @param onChunk - Callback per il testo ricevuto
   * @param temperature - Creatività della risposta
   * @param signal - AbortSignal per annullare la richiesta
   */
  async streamChatCompletion(
    providedKey: string,
    messages: any[],
    onChunk: (text: string) => void,
    _model = 'gemini-1.5-flash-latest',
    temperature = 0.5,
    signal?: AbortSignal
  ) {
    const apiKey = (providedKey || envKey || '').trim();
    if (!apiKey) throw new Error('Configurazione di sicurezza: Chiave Gemini non valida');

    // Proviamo prima con il modello richiesto (o il nuovo standard 2.0)
    let primaryModel = _model?.trim() || 'gemini-2.0-flash';
    if (primaryModel.includes('1.5-flash') && !primaryModel.includes('latest')) {
       primaryModel = 'gemini-2.0-flash';
    }

    try {
      return await this._executeStream(apiKey, primaryModel, messages, onChunk, temperature, signal);
    } catch (err: any) {
      // FALLBACK: Se 2.0 fallisce (es. non ancora disponibile per quella chiave o quota esaurita), 
      // proviamo il super-stabile 1.5-flash
      if (primaryModel !== 'gemini-1.5-flash') {
        console.warn(`[SECURITY LOG] Gemini ${primaryModel} fallito, provo fallback su 1.5-flash...`);
        return await this._executeStream(apiKey, 'gemini-1.5-flash', messages, onChunk, temperature, signal);
      }
      throw err;
    }
  },

  async _executeStream(apiKey: string, model: string, messages: any[], onChunk: (text: string) => void, temperature: number, signal?: AbortSignal) {
    const systemInstruction = messages.find((m) => m.role === 'system')?.content;
    const history = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    const body: any = {
      contents: history,
      generationConfig: { temperature, maxOutputTokens: 8192 },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ]
    };

    // Includiamo le istruzioni di sistema nel formato corretto per Gemini
    if (systemInstruction) {
      body.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    // Usiamo v1 per massima stabilità con i modelli 1.5 e 2.0
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:streamGenerateContent?key=${apiKey}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal
    });


    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || `Errore Gemini ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('Streaming Gemini non disponibile');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let startIdx = buffer.indexOf('{');
      while (startIdx !== -1) {
        let depth = 0;
        let endIdx = -1;
        for (let i = startIdx; i < buffer.length; i++) {
          if (buffer[i] === '{') depth++;
          else if (buffer[i] === '}') depth--;
          if (depth === 0) { endIdx = i; break; }
        }

        if (endIdx !== -1) {
          const jsonStr = buffer.substring(startIdx, endIdx + 1);
          try {
            const json = JSON.parse(jsonStr);
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) onChunk(text);
          } catch (e) {}
          buffer = buffer.substring(endIdx + 1);
          startIdx = buffer.indexOf('{');
        } else break;
      }
    }
  },

  /**
   * Verifica la connettività con l'endpoint Google.
   */
  async testConnection(providedKey: string, _model = 'gemini-1.5-flash') {
    const apiKey = (providedKey || envKey || '').trim();
    if (!apiKey) return { ok: false, status: 0, error: 'Chiave mancante' };

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${_model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Ping' }] }],
          generationConfig: { maxOutputTokens: 1 }
        })
      });

      const data = await response.json().catch(() => ({}));
      return {
        status: response.status,
        ok: response.ok,
        error: response.ok ? null : (data?.error?.message || `Status: ${response.status}`),
        data: response.ok ? { status: 'online' } : data
      };
    } catch (err: any) {
      return { status: 0, ok: false, error: 'Connessione fallita' };
    }
  }
};

