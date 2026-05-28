import { useAuth } from '../../context/AuthContext.jsx';
import { getAgentMeta } from '../../utils/agents.js';
import MarkdownRenderer from './MarkdownRenderer.jsx';

export default function MessageList({ messages, streamingText, activeAgent, isStreaming }) {
  const { user } = useAuth();

  return (
    <div>
      {messages.map((msg, i) => (
        <MessageBubble key={msg._id} message={msg} user={user} index={i} />
      ))}

      {isStreaming && (
        <StreamingBubble
          agent={activeAgent}
          text={streamingText}
          waitingForAgent={!activeAgent}
        />
      )}
    </div>
  );
}

function MessageBubble({ message, user, index }) {
  const isUser = message.role === 'user';
  const time = new Date(message.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  if (isUser) {
    return (
      <article
        className="py-8 border-b border-rule-subtle animate-fade-in"
        style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)' }}
      >
        <div className="flex items-baseline gap-4 mb-3">
          <span className="numeral text-2xl text-ink-faint">{String(index + 1).padStart(2, '0')}</span>
          <span className="label-xs text-signal">YOU</span>
          <span className="label-xs text-ink-faint">· {user?.name || 'You'} · {time}</span>
        </div>
        <div className="pl-12 text-ink-muted whitespace-pre-wrap leading-relaxed font-display italic text-xl md:text-2xl">
          {message.content}
        </div>
      </article>
    );
  }

  const meta = getAgentMeta(message.agent);
  const Icon = meta.icon;

  return (
    <article
      className="py-8 border-b border-rule-subtle animate-fade-in"
      style={{ animation: 'fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1)' }}
    >
      <div className="flex items-baseline gap-4 mb-4 flex-wrap">
        <span className="numeral text-2xl text-ink-faint">{String(index + 1).padStart(2, '0')}</span>
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} strokeWidth={2} />
          <span className="label-xs" style={{ color: meta.color }}>{meta.label}</span>
        </div>
        <span className="label-xs text-ink-faint">· {meta.role} · {time}</span>
      </div>
      <div className="pl-12 prose-mind">
        <MarkdownRenderer content={message.content} />
      </div>
    </article>
  );
}

function StreamingBubble({ agent, text, waitingForAgent }) {
  const meta = getAgentMeta(agent);
  const Icon = meta.icon;

  return (
    <article className="py-8 border-b border-rule-subtle animate-fade-in">
      <div className="flex items-baseline gap-4 mb-4 flex-wrap">
        <span className="numeral text-2xl text-ink-faint">··</span>
        {waitingForAgent ? (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse-dot"></span>
            <span className="label-xs text-ink-muted">DISPATCHING…</span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} strokeWidth={2} />
              <span className="label-xs" style={{ color: meta.color }}>{meta.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-signal animate-pulse-dot"></span>
              <span className="label-xs text-ink-faint">THINKING · LIVE</span>
            </div>
          </>
        )}
      </div>

      {text ? (
        <div className="pl-12 prose-mind cursor-block">
          <MarkdownRenderer content={text} />
        </div>
      ) : (
        <div className="pl-12 flex items-center gap-2 text-ink-faint">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-signal animate-pulse-dot"></span>
            <span className="w-1.5 h-1.5 bg-signal animate-pulse-dot" style={{ animationDelay: '0.2s' }}></span>
            <span className="w-1.5 h-1.5 bg-signal animate-pulse-dot" style={{ animationDelay: '0.4s' }}></span>
          </div>
        </div>
      )}
    </article>
  );
}
