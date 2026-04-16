import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export const geminiService = {
  async streamChatCompletion(
    apiKey: string,
    messages: any[],
    onChunk: (text: string) => void,
    temperature = 0.7
  ) {
    if (!apiKey) throw new Error('Gemini API Key missing');

    // SOLO i modelli verificati per l'account dell'utente
    const modelRotation = [
      'gemini-2.0-flash-lite',
      'gemini-flash-latest',
      'gemini-pro-latest'
    ];

    const uniqueModels = [...new Set(modelRotation)];
    let lastError: any = null;

    for (const modelName of uniqueModels) {
      console.log(`GeminiService: Tentativo con modello VERIFICATO ${modelName}...`);
      
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const systemInstruction = messages.find(m => m.role === 'system')?.content || '';
        const model = genAI.getGenerativeModel({ model: modelName, systemInstruction });

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
          try {
            const chunkText = chunk.text();
            if (chunkText) {
              onChunk(chunkText);
            }
          } catch (e) {
             console.warn("Gemini: Error parsing chunk", e);
          }
        }
        
        return; 

      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || '';
        
        // Se è un 404, significa che il modello non è attivo, saltiamo subito
        if (errMsg.includes('404')) {
           console.warn(`GeminiService: Modello ${modelName} non trovato (404).`);
           continue;
        }

        // Se è un 429, informiamo l'utente e aspettiamo un po'
        if (errMsg.includes('429')) {
           onChunk(`\n\n⚠️ ${modelName} in pausa quota. Passo al prossimo...\n\n`);
           await new Promise(resolve => setTimeout(resolve, 3000));
           continue;
        }

        throw err;
      }
    }

    throw lastError || new Error("Configurazione Gemini non riuscita.");
  }
};
