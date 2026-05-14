/**
 * Servizio per l'interazione con l'API di Groq via REST.
 * Sostituisce l'SDK ufficiale per garantire massima compatibilità in ambienti Browser ed Electron
 * senza problemi di inizializzazione o CORS (gestito via fetch).
 */
const envKey = import.meta.env.VITE_GROQ_API_KEY;

export const groqService = {
  /**
   * Avvia una chat completion in streaming via fetch.
   * 
   * @param messages - Array di messaggi {role, content}
   * @param model - Modello Groq (default: llama-3.3-70b-versatile)
   * @param onChunk - Callback per gestire i frammenti di testo ricevuti
   * @param temperature - Creatività della risposta
   * @param signal - AbortSignal per terminare la richiesta
   * @param providedKey - Chiave API passata dall'utente
   */
  async streamChatCompletion(
    messages: any[],
    model = 'llama-3.3-70b-versatile',
    onChunk: (text: string) => void,
    temperature = 0.55,
    signal?: AbortSignal,
    providedKey?: string
  ) {
    const apiKey = (providedKey || envKey || '').trim();
    if (!apiKey) {
      console.error('[SECURITY LOG] Groq API Key missing.');
      throw new Error('Servizio Groq non configurato: chiave API mancante.');
    }

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        signal,
        body: JSON.stringify({
          model,
          messages,
          temperature,
          stream: true,
          max_tokens: 8192,
        }),
      });

      if (!response.ok) {
        let errorMessage = `Errore Groq (Status: ${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData.error?.message) {
            errorMessage = `Groq Error: ${errorData.error.message}`;
          }
        } catch (e) {}
        
        console.error('[SECURITY LOG] Groq API Error:', errorMessage);
        throw new Error(errorMessage);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Interfaccia streaming Groq fallita');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        if (signal?.aborted) {
          reader.cancel();
          break;
        }
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
              if (content) onChunk(content);
            } catch (e) {}
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('[SECURITY LOG] Groq Stream Exception:', err.message);
      throw err;
    }
  },
  
  /**
   * Verifica la connettività con l'endpoint Groq.
   */
  async testConnection(apiKey?: string, model = 'llama-3.3-70b-versatile') {
    const key = (apiKey || envKey || '').trim();
    if (!key) return { ok: false, status: 0, error: 'Chiave Groq mancante' };
    
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Ping' }],
          model,
          max_tokens: 1
        })
      });

      const data = await response.json().catch(() => ({}));
      return {
        ok: response.ok,
        status: response.status,
        error: response.ok ? null : (data.error?.message || `Status: ${response.status}`),
        data: response.ok ? { status: 'online', model: data.model } : data
      };
    } catch (err: any) {
      console.error('[SECURITY LOG] Groq Connection Test Failed:', err.message);
      return {
        ok: false,
        status: 0,
        error: 'Connessione ai server Groq fallita'
      };
    }
  }
};

