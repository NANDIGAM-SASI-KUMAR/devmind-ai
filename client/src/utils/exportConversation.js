import { conversationsAPI } from '../api/conversations.js';
import { getAgentMeta } from './agents.js';

const slugify = (s) =>
  s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'conversation';

export const exportConversationAsMarkdown = async (conversation) => {
  const messages = await conversationsAPI.messages(conversation._id);

  const lines = [`# ${conversation.title}`, '', `_Exported from DevMind on ${new Date().toLocaleString()}_`, ''];

  for (const m of messages) {
    const time = new Date(m.createdAt).toLocaleString();
    if (m.role === 'user') {
      lines.push(`### You · ${time}`, '', m.content, '');
    } else {
      const meta = getAgentMeta(m.agent);
      lines.push(`### ${meta.label} · ${time}`, '', m.content, '');
    }
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(conversation.title)}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
