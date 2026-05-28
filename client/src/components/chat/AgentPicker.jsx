import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Check } from 'lucide-react';
import { AGENT_META } from '../../utils/agents.js';

export default function AgentPicker({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = value ? AGENT_META[value] : null;
  const Icon = current?.icon;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="group flex items-center gap-2.5 px-3 py-2 border border-rule hover:border-rule-strong transition-colors"
      >
        {current ? (
          <>
            <span className="label-xs" style={{ color: current.color }}>{current.n}</span>
            <Icon className="w-3.5 h-3.5" style={{ color: current.color }} strokeWidth={1.8} />
            <span className="label-xs text-ink">{current.label}</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5 text-signal" strokeWidth={1.8} />
            <span className="label-xs text-ink-muted">Auto-route</span>
          </>
        )}
        <ChevronDown className={`w-3 h-3 text-ink-faint transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-72 bg-paper border border-rule-strong p-2 z-20"
          style={{ animation: 'fadeUp 0.25s cubic-bezier(0.22, 1, 0.36, 1)' }}
        >
          <div className="px-3 py-2 label-xs text-ink-faint border-b border-rule-subtle">
            DISPATCH TO
          </div>

          <button
            onClick={() => { onChange(null); setOpen(false); }}
            className="w-full px-3 py-2.5 hover:bg-surface transition-colors flex items-center gap-3 text-left mt-1"
          >
            <Sparkles className="w-4 h-4 text-signal" strokeWidth={1.8} />
            <div className="flex-1">
              <div className="text-sm text-ink">Auto-route</div>
              <div className="label-xs text-ink-faint mt-0.5">Let the orchestrator choose</div>
            </div>
            {!value && <Check className="w-4 h-4 text-signal" />}
          </button>

          <div className="hairline my-1.5"></div>

          {Object.entries(AGENT_META).map(([key, meta]) => {
            const I = meta.icon;
            return (
              <button
                key={key}
                onClick={() => { onChange(key); setOpen(false); }}
                className="w-full px-3 py-2.5 hover:bg-surface transition-colors flex items-center gap-3 text-left"
              >
                <span className="label-xs w-6" style={{ color: meta.color }}>{meta.n}</span>
                <I className="w-4 h-4" style={{ color: meta.color }} strokeWidth={1.8} />
                <div className="flex-1">
                  <div className="text-sm text-ink">{meta.label}</div>
                  <div className="label-xs text-ink-faint mt-0.5">{meta.role}</div>
                </div>
                {value === key && <Check className="w-4 h-4 text-signal" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
