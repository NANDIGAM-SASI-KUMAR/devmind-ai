import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

const getClient = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in .env');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const MODEL = 'gemini-2.0-flash';

const toGeminiHistory = (messages) =>
  messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

export const callLLM = async ({ system, messages, maxTokens = 2048 }) => {
  const model = getClient().getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
    generationConfig: { maxOutputTokens: maxTokens }
  });
  const history = toGeminiHistory(messages);
  const last = history.pop();
  const chat = model.startChat({ history });
  const result = await chat.sendMessage(last.parts[0].text);
  return result.response.text();
};

export const streamLLM = async ({ system, messages, maxTokens = 2048, onChunk }) => {
  const model = getClient().getGenerativeModel({
    model: MODEL,
    systemInstruction: system,
    generationConfig: { maxOutputTokens: maxTokens }
  });
  const history = toGeminiHistory(messages);
  const last = history.pop();
  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(last.parts[0].text);
  let full = '';
  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      full += text;
      if (onChunk) onChunk(text);
    }
  }
  return full;
};