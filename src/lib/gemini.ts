import { GoogleGenerativeAI } from '@google/generative-ai';

export const geminiService = {
  async streamChatCompletion(
    apiKey: string,
    messages: any[],
    modelName = 'gemini-1.5-flash',
    onChunk: (text: string) => void,
    temperature = 0.7
  ) {
    if (!apiKey) throw new Error('Gemini API Key missing');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Map OpenAI-style messages to Gemini format
    const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
    const chatHistory = messages
      .filter(m => m.role !== 'system')
      .slice(0, -1)
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));
    const lastMessage = messages[messages.length - 1].content;

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature,
        maxOutputTokens: 2048,
      },
      systemInstruction,
    });

    const result = await chat.sendMessageStream(lastMessage);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      onChunk(chunkText);
    }
  }
};
