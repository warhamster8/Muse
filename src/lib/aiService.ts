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
      if (!config.geminiKey) throw new Error('Chiave Gemini non trovata nel profilo');
      
      return geminiService.streamChatCompletion(
        config.geminiKey,
        messages,
        onChunk,
        options?.temperature
      );
    }

    // Default: Groq
    return groqService.streamChatCompletion(
      messages,
      'llama-3.3-70b-versatile',
      onChunk,
      options?.temperature
    );
  }
};
