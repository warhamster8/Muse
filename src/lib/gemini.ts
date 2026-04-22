import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

/**
 * Servizio per l'interazione con l'API di Google Gemini tramite SDK ufficiale.
 * Gestisce lo streaming e la diagnostica di connessione in modo robusto.
 */
export const geminiService = {
  /**
   * Avvia una chat completion in streaming via SDK ufficiale.
   * 
   * @param apiKey - Chiave API Google AI Studio
   * @param messages - Cronologia messaggi {role, content}
   * @param onChunk - Callback per il testo ricevuto
   * @param temperature - Creatività della risposta (0.0 - 1.0)
   */
  async streamChatCompletion(
    apiKey: string,
    messages: any[],
    onChunk: (text: string) => void,
    temperature = 0.7
  ) {
    if (!apiKey || apiKey.length < 10) {
      throw new Error('Configurazione di sicurezza: Chiave Gemini non valida');
    }

    const genAI = new GoogleGenerativeAI(apiKey.trim());
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: 4096,
      }
    });

    const systemInstruction = messages.find((m) => m.role === 'system')?.content;
    const history = messages
      .filter((m) => m.role !== 'system')
      .slice(0, -1)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));
    
    const lastMessage = messages[messages.length - 1].content;

    try {
      const chat = model.startChat({
        history: history,
        systemInstruction: systemInstruction,
      });

      const result = await chat.sendMessageStream(lastMessage);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          onChunk(chunkText);
        }
      }
    } catch (err: any) {
      console.error('[SECURITY LOG] Gemini SDK Stream Exception:', err);
      // Trasmettiamo un messaggio di errore più leggibile se è un problema di auth
      if (err.message?.includes('401') || err.message?.includes('unauthenticated')) {
        throw new Error('Errore di Autenticazione (401): La chiave API non è valida o non è autorizzata per questo servizio.');
      }
      throw err;
    }
  },

  /**
   * Verifica la connettività con l'endpoint Google tramite SDK.
   */
  async testConnection(apiKey: string) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey.trim());
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent("Ping");
      await result.response;
      
      return {
        status: 200,
        ok: true,
        data: { status: 'authorized' }
      };
    } catch (err: any) {
      console.error('[SECURITY LOG] Gemini Connection Test Failed:', err);
      
      // Tentiamo di estrarre lo status se disponibile
      const statusMatch = err.message?.match(/(\d{3})/);
      const status = statusMatch ? parseInt(statusMatch[1]) : 0;
      
      return {
        status: status,
        ok: false,
        error: err.message || 'Connessione al Nucleo Gemini fallita'
      };
    }
  }
};
