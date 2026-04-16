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
        config.model,
        onChunk,
        options?.temperature
      );
    } else {
      // Groq handles its own key from environment or we could pass it if needed,
      // but typically Groq keys are set on the server/env for security.
      return groqService.streamChatCompletion(
        messages,
        config.model,
        onChunk,
        options?.temperature
      );
    }
  }
};
