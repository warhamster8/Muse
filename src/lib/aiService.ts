import { groqService } from './groq';

export type AIProvider = 'groq' | 'gemini';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  geminiKey?: string;
}

export const aiService = {
  async streamChat(
    _config: AIConfig,
    messages: any[],
    onChunk: (text: string) => void,
    options?: { temperature?: number }
  ) {
    // Ripristinato all'originale: ignoriamo Gemini e usiamo solo Groq
    return groqService.streamChatCompletion(
      messages,
      'llama-3.3-70b-versatile',
      onChunk,
      options?.temperature
    );
  }
};
