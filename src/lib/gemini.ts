import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

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
    const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
    const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });

    // Map OpenAI-style messages to Gemini format
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
        maxOutputTokens: 4096,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    try {
      const result = await chat.sendMessageStream(lastMessage);

      for await (const chunk of result.stream) {
        try {
          const chunkText = chunk.text();
          onChunk(chunkText);
        } catch (e) {
          console.warn("Gemini: Could not parse chunk", e);
        }
      }
    } catch (err: any) {
      if (err?.message?.includes('Failed to parse stream') || err?.message?.includes('fetch')) {
         console.warn("Stream failed, attempting non-streaming fallback...");
         try {
           const fallbackResult = await chat.sendMessage(lastMessage);
           onChunk(fallbackResult.response.text());
         } catch (fallbackErr: any) {
           throw new Error(fallbackErr?.message || "Errore di connessione irreversibile.");
         }
      } else {
         throw err;
      }
    }
  }
};
