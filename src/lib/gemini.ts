import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export const geminiService = {
  async streamChatCompletion(
    apiKey: string,
    messages: any[],
    requestedModel = 'gemini-2.0-flash-lite',
    onChunk: (text: string) => void,
    temperature = 0.7
  ) {
    if (!apiKey) throw new Error('Gemini API Key missing');

    // Lista ottimizzata: modelli leggeri -> Gemma -> Pro
    const modelRotation = [
      requestedModel,
      'gemini-2.0-flash-lite',
      'gemini-flash-latest',
      'gemma-3-27b-it',
      'gemma-3-4b-it',
      'gemini-pro-latest'
    ];

    const uniqueModels = [...new Set(modelRotation)];
    let lastError: any = null;

    for (const modelName of uniqueModels) {
      console.log(`GeminiService: Tentativo con modello ${modelName}...`);
      
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
            maxOutputTokens: 2048, // Ridotto per essere più "leggeri"
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
              console.log(`GeminiService [${modelName}]: Received chunk`);
              onChunk(chunkText);
            }
          } catch (e) {
            const feedback = (chunk as any).promptFeedback;
            if (feedback?.blockReason) {
               onChunk(`\n\n❌ Blocco Sicurezza (${modelName}): ${feedback.blockReason}\n\n`);
            }
          }
        }
        
        return; 

      } catch (err: any) {
        lastError = err;
        const errMsg = err?.message || '';
        console.error(`GeminiService: Fallimento con ${modelName}:`, errMsg);

        if (!errMsg.includes('429') && !errMsg.includes('404') && !errMsg.includes('quota')) {
          throw err;
        }

        onChunk(`\n\n⚠️ ${modelName} indisponibile. Raffreddamento 2s e cambio modello...\n\n`);
        
        // Pausa di raffreddamento prima del prossimo tentativo
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw lastError || new Error("Tutti i modelli (Gemini/Gemma) hanno fallito.");
  }
};
