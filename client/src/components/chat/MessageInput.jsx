import { useRef, useEffect, useState } from 'react';
import { ArrowUpRight, Square } from 'lucide-react';

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 220) + 'px';
  }, [text]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text);
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div
        className={`flex items-end gap-3 bg-surface border transition-colors p-3 ${
          text ? 'border-signal/60' : 'border-rule-strong'
        } focus-within:border-signal`}
      >
        <span className="label-xs text-signal pt-3 pl-1">→</span>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={disabled ? 'An agent is responding…' : 'Compose a message…'}
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent px-2 py-2.5 text-ink placeholder:text-ink-faint resize-none focus:outline-none disabled:opacity-50 font-display italic text-xl leading-relaxed"
          style={{ maxHeight: '220px' }}
        />

        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="group flex items-center gap-2 px-4 py-2.5 bg-signal text-paper hover:bg-ink disabled:bg-surface disabled:text-ink-faint transition-colors flex-shrink-0"
          title="Send (Enter)"
        >
          {disabled ? (
            <Square className="w-3.5 h-3.5 fill-current" />
          ) : (
            <>
              <span className="label-xs hidden sm:inline">Send</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>

      <div className="flex items-center justify-between mt-2 px-1 label-xs text-ink-faint">
        <div className="flex items-center gap-4">
          <span>
            <kbd className="px-1.5 py-0.5 mono text-[10px] border border-rule">⏎</kbd>
            <span className="ml-2">send</span>
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 mono text-[10px] border border-rule">⇧ ⏎</kbd>
            <span className="ml-2">new line</span>
          </span>
        </div>
        <span className="hidden sm:inline">DEVMIND · CHAT</span>
      </div>
    </form>
  );
}
