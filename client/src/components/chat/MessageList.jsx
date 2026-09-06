import { useState } from 'react';
import { Sparkles, Copy, Check, Pencil, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { getAgentMeta } from '../../utils/agents.js';
import MarkdownRenderer from './MarkdownRenderer.jsx';

export default function MessageList({ messages, streamingText, activeAgent, isStreaming, onEditMessage, onRegenerateMessage, onExplainCode }) {
  const { user } = useAuth();

  return (
    <div className="space-y-5">
      {messages.map((msg) => (
        <MessageBubble
          key={msg._id}
          message={msg}
          user={user}
          onEditMessage={onEditMessage}
          onRegenerateMessage={onRegenerateMessage}
          onExplainCode={onExplainCode}
          disabled={isStreaming}
        />
      ))}

      {isStreaming && (
        <StreamingBubble agent={activeAgent} text={streamingText} waitingForAgent={!activeAgent} />
      )}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };
  return (
    <button onClick={handleCopy} aria-label="Copy message" className="p-1 rounded text-text2-faint hover:text-text2 transition-colors" title="Copy">
      {copied ? <Check className="w-3 h-3 text-state-success" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function MessageBubble({ message, user, onEditMessage, onRegenerateMessage, onExplainCode, disabled }) {
  const isUser = message.role === 'user';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const time = new Date(message.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  if (isUser) {
    if (editing) {
      return (
        <div className="flex justify-end auth-fade-in">
          <div className="max-w-[80%] w-full sm:w-[420px]">
            <div className="field-shell rounded-2xl rounded-tr-sm p-3">
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={Math.min(8, Math.max(2, draft.split('\n').length))}
                className="w-full bg-transparent text-sm text-text2 placeholder:text-text2-faint focus:outline-none resize-none"
              />
              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  onClick={() => { setEditing(false); setDraft(message.content); }}
                  aria-label="Cancel edit"
                  className="p-1.5 rounded-lg text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setEditing(false); onEditMessage?.(message._id, draft.trim()); }}
                  disabled={!draft.trim()}
                  className="btn-brand px-3 py-1.5 rounded-lg text-white text-xs font-semibold disabled:opacity-50"
                >
                  Save &amp; regenerate
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="group flex justify-end auth-fade-in">
        <div className="max-w-[80%]">
          <div className="flex items-center justify-end gap-1.5 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!disabled && (
              <button onClick={() => setEditing(true)} aria-label="Edit message" className="p-1 rounded text-text2-faint hover:text-text2 transition-colors" title="Edit">
                <Pencil className="w-3 h-3" />
              </button>
            )}
            <CopyButton text={message.content} />
          </div>
          <div className="rounded-2xl rounded-tr-sm bg-brand text-white px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
          <div className="text-[11px] text-text2-faint text-right mt-1.5 pr-1">{time}</div>
        </div>
      </div>
    );
  }

  const meta = getAgentMeta(message.agent);
  const Icon = meta.icon;

  return (
    <div className="group flex justify-start auth-fade-in">
      <div className="max-w-[85%] w-full sm:w-auto">
        <div className="rounded-2xl rounded-tl-sm bg-card border border-line2 px-4 py-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: `${meta.color}22` }}>
              <Icon className="w-3 h-3" style={{ color: meta.color }} strokeWidth={2.2} />
            </div>
            <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
            <span className="text-xs text-text2-faint">· {meta.role}</span>
            <div className="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!disabled && (
                <button
                  onClick={() => onRegenerateMessage?.(message._id, message.agent)}
                  aria-label="Regenerate response"
                  className="p-1 rounded text-text2-faint hover:text-text2 transition-colors"
                  title="Regenerate"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
              <CopyButton text={message.content} />
            </div>
          </div>
          <div className="prose-mind">
            <MarkdownRenderer content={message.content} onExplain={onExplainCode} />
          </div>
        </div>
        <div className="text-[11px] text-text2-faint mt-1.5 pl-1">{time}</div>
      </div>
    </div>
  );
}

function StreamingBubble({ agent, text, waitingForAgent }) {
  const meta = getAgentMeta(agent);
  const Icon = meta.icon;

  // Before content arrives: show the full workflow panel (analyze → route → execute).
  // Once content starts streaming, collapse it into a compact strip so it doesn't
  // eat vertical space during long responses.
  if (!text) {
    return (
      <div className="flex justify-start auth-fade-in">
        <div className="max-w-[85%] w-full sm:w-[380px] rounded-2xl border border-line2 bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-line2 bg-card-raised">
            <Sparkles className="w-3.5 h-3.5 text-specialist-orchestrator" />
            <span className="text-[11px] font-semibold tracking-wide text-text2-muted">DEVMIND AGENT WORKFLOW</span>
          </div>
          <div className="px-4 py-3.5 space-y-2.5">
            <WorkflowStep done label="Request analyzed" />
            <WorkflowStep
              done={!waitingForAgent}
              active={waitingForAgent}
              label={waitingForAgent ? 'Routing to a specialist…' : `Routed to ${meta.label}`}
              color="#A78BFA"
            />
            <WorkflowStep
              active={!waitingForAgent}
              pending={waitingForAgent}
              label={waitingForAgent ? 'Waiting' : `${meta.label} working…`}
              color={meta.color}
              icon={waitingForAgent ? undefined : Icon}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start auth-fade-in">
      <div className="max-w-[85%] w-full sm:w-auto rounded-2xl rounded-tl-sm bg-card border border-line2 px-4 py-3.5">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ backgroundColor: `${meta.color}22` }}>
            <Icon className="w-3 h-3" style={{ color: meta.color }} strokeWidth={2.2} />
          </div>
          <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
          <span className="flex items-center gap-1.5 ml-auto text-[10px] text-text2-faint">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: meta.color }}></span>
            Working
          </span>
        </div>
        <div className="prose-mind cursor-block">
          <MarkdownRenderer content={text} />
        </div>
      </div>
    </div>
  );
}

function WorkflowStep({ done, active, pending, label, color = '#22C55E', icon: Icon }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${pending ? 'border border-line2-strong' : ''}`}
        style={!pending ? { backgroundColor: `${done ? '#22C55E' : color}22` } : undefined}
      >
        {done && !active ? (
          <Check className="w-2.5 h-2.5 text-state-success" strokeWidth={3} />
        ) : active ? (
          Icon ? <Icon className="w-2.5 h-2.5" style={{ color }} strokeWidth={2.5} /> : <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ backgroundColor: color }}></span>
        ) : null}
      </div>
      <span className={`text-xs ${pending ? 'text-text2-faint' : active ? 'text-text2 font-medium' : 'text-text2-muted'}`}>{label}</span>
    </div>
  );
}
