import { API_URL } from './client.js';

/**
 * POSTs to `url` and streams back SSE events, calling onEvent(event) for each one.
 * Event types vary by endpoint but generally include: agent_selected,
 * user_message_saved, chunk, done, error.
 */
const streamSSE = async (url, body, onEvent, signal) => {
  const token = localStorage.getItem('token');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(body),
    signal
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(errBody.message || 'Chat request failed');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n\n');
    buffer = lines.pop(); // keep incomplete line

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const event = JSON.parse(line.slice(6));
        onEvent(event);
      } catch (e) {
        console.error('Parse error:', e, line);
      }
    }
  }
};

/** Send a new chat message and stream the response. */
export const streamChatMessage = ({ conversationId, message, agent, onEvent, signal }) =>
  streamSSE(`${API_URL}/chat/${conversationId}`, { message, agent }, onEvent, signal);

/** Delete an assistant message and re-run its preceding prompt, streaming a fresh response. */
export const regenerateMessage = ({ conversationId, messageId, agent, onEvent, signal }) =>
  streamSSE(`${API_URL}/chat/${conversationId}/regenerate`, { messageId, agent }, onEvent, signal);

/** Edit a user message, drop everything after it, and stream a fresh response. */
export const editChatMessage = ({ conversationId, messageId, content, agent, onEvent, signal }) =>
  streamSSE(`${API_URL}/chat/${conversationId}/edit`, { messageId, content, agent }, onEvent, signal);
