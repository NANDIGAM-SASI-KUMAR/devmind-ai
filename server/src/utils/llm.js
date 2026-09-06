const API_URL = 'https://api.sarvam.ai/v1/chat/completions';
// sarvam-105b is a reasoning model that spends part of max_tokens on hidden
// reasoning_content before writing the actual answer — with small token budgets
// (e.g. the router's one-word classification) that leaves nothing for `content`,
// which comes back null. sarvam-105b-conversations answers directly instead.
const MODEL = 'sarvam-105b-conversations';

const getApiKey = () => {
  if (!process.env.SARVAM_API_KEY) {
    throw new Error('SARVAM_API_KEY is not set in .env');
  }
  return process.env.SARVAM_API_KEY;
};

const toSarvamMessages = (system, messages) => [
  { role: 'system', content: system },
  ...messages.map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
];

export const callLLM = async ({ system, messages, maxTokens = 2048 }) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: toSarvamMessages(system, messages),
      max_tokens: maxTokens
    })
  });
  if (!res.ok) {
    throw new Error(`Sarvam API error ${res.status}: ${await res.text()}`);
  }
  const data = await res.json();
  return data.choices[0].message.content;
};

export const streamLLM = async ({ system, messages, maxTokens = 2048, onChunk }) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: MODEL,
      messages: toSarvamMessages(system, messages),
      max_tokens: maxTokens,
      stream: true
    })
  });
  if (!res.ok) {
    throw new Error(`Sarvam API error ${res.status}: ${await res.text()}`);
  }

  let full = '';
  let buffer = '';
  for await (const chunk of res.body) {
    buffer += Buffer.from(chunk).toString('utf8');
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === '[DONE]') continue;
      const parsed = JSON.parse(payload);
      const text = parsed.choices?.[0]?.delta?.content;
      if (text) {
        full += text;
        if (onChunk) onChunk(text);
      }
    }
  }
  return full;
};
