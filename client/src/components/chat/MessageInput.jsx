import { useRef, useEffect, useState } from 'react';
import { ArrowUp, Square } from 'lucide-react';

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
    <form onSubmit={handleSubmit}>
      <div className="field-shell rounded-2xl p-3">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder={disabled ? 'A specialist is responding…' : 'What do you want to build?'}
          rows={1}
          disabled={disabled}
          className="w-full bg-transparent px-1.5 pt-1 pb-2 text-text2 text-sm placeholder:text-text2-faint resize-none focus:outline-none disabled:opacity-50 leading-relaxed"
          style={{ maxHeight: '220px' }}
        />

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3 text-[11px] text-text2-faint">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-line2 font-mono text-[10px]">⏎</kbd>
              send
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-line2 font-mono text-[10px]">⇧⏎</kbd>
              new line
            </span>
          </div>

          <button
            type="submit"
            disabled={!text.trim() || disabled}
            aria-label={disabled ? 'Stop response' : 'Send message'}
            className="btn-brand flex items-center justify-center w-8 h-8 rounded-lg text-white disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            title="Send (Enter)"
          >
            {disabled ? <Square className="w-3 h-3 fill-current" /> : <ArrowUp className="w-4 h-4" strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </form>
  );
}
