import { API_URL } from './client.js';

/**
 * Send a chat message and stream the response.
 * Calls onEvent(event) for every SSE event.
 *
 * Event types: agent_selected, user_message_saved, chunk, done, error
 */
export const streamChatMessage = async ({ projectId, message, agent, onEvent, signal }) => {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/chat/${projectId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ message, agent }),
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
