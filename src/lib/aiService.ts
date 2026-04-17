import { groqService } from './groq';
import { deepseekService } from './deepseek';

export type AIProvider = 'groq' | 'deepseek';

export interface AIConfig {
  provider: AIProvider;
  model: string;
  deepseekKey?: string;
}

export const aiService = {
  async streamChat(
    config: AIConfig,
    messages: any[],
    onChunk: (text: string) => void,
    options?: { temperature?: number, signal?: AbortSignal }
  ) {
    if (config.provider === 'deepseek') {
      if (!config.deepseekKey) throw new Error('Chiave DeepSeek non trovata nel profilo');
      
      return deepseekService.streamChatCompletion(
        config.deepseekKey,
        messages,
        onChunk,
        options?.temperature,
        options?.signal
      );
    }

    // Default: Groq
    return groqService.streamChatCompletion(
      messages,
      'llama-3.3-70b-versatile',
      onChunk,
      options?.temperature,
      options?.signal
    );
  }
};
