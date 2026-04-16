import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export const geminiService = {
  async streamChatCompletion(
    apiKey: string,
    messages: any[],
    onChunk: (text: string) => void,
    temperature = 0.7
  ) {
    if (!apiKey) throw new Error('Gemini API Key missing');

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Utilizziamo gemini-1.5-flash per il miglior rapporto velocità/contesto
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        systemInstruction: messages.find(m => m.role === 'system')?.content || ''
      });

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
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      });

      const result = await chat.sendMessageStream(lastMessage);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          onChunk(chunkText);
        }
      }
    } catch (err: any) {
      console.error("Gemini Error:", err);
      throw err;
    }
  }
};
