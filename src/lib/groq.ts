import Groq from 'groq-sdk';

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

const groq = apiKey ? new Groq({ apiKey, dangerouslyAllowBrowser: true }) : null;

export const groqService = {
  async getChatCompletion(messages: any[], model = 'llama-3.3-70b-versatile') {
    if (!groq) throw new Error('Groq API Key missing');
    
    return groq.chat.completions.create({
      messages,
      model,
      temperature: 0.7,
    });
  },

  async streamChatCompletion(messages: any[], model = 'llama-3.3-70b-versatile', onChunk: (text: string) => void) {
    if (!groq) throw new Error('Groq API Key missing');

    const stream = await groq.chat.completions.create({
      messages,
      model,
      stream: true,
      temperature: 0.7,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      onChunk(content);
    }
  }
};
