import { groqService } from './groq';
import { geminiService } from './gemini';

export type AIProvider = 'groq' | 'gemini';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  geminiKey?: string;
}

export const aiService = {
  async streamChat(
    config: AIConfig,
    messages: any[],
    onChunk: (text: string) => void,
    options?: { temperature?: number }
  ) {
    if (config.provider === 'gemini') {
      if (!config.geminiKey) throw new Error('Chiave API Gemini non configurata.');
      return geminiService.streamChatCompletion(
        config.geminiKey,
        messages,
        onChunk,
        options?.temperature
      );
    } else {
      try {
        return await groqService.streamChatCompletion(
          messages,
          config.model,
          onChunk,
          options?.temperature
        );
      } catch (err: any) {
        // Se Groq 70B fallisce per quota (429), proviamo il modello 8B che ha limiti enormi
        if ((err?.message?.includes('429') || err?.message?.includes('limit')) && config.model.includes('70b')) {
          console.warn("aiService: Groq 70B fallito (quota), provo fallback su Llama 8B...");
          onChunk("\n\n⚠️ Quota Groq 70B piena. Utilizzo modello ultra-veloce Llama 8B...\n\n");
          
          return groqService.streamChatCompletion(
            messages,
            'llama-3.1-8b-instant',
            onChunk,
            options?.temperature
          );
        }
        throw err;
      }
    }
  }
};
