import { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], label: 'Open command palette / search', note: '⌘K on Mac' },
  { keys: ['Enter'], label: 'Send message' },
  { keys: ['Shift', 'Enter'], label: 'New line in message' },
  { keys: ['Esc'], label: 'Close dialogs and menus' }
];

export default function KeyboardShortcutsModal({ onClose }) {
  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm auth-card rounded-2xl p-6 shadow-2xl shadow-black/50 auth-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-brand-soft" />
            <h2 className="font-heading text-lg font-bold text-text2">Keyboard shortcuts</h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {SHORTCUTS.map((s) => (
            <div key={s.label} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-text2">{s.label}</p>
                {s.note && <p className="text-xs text-text2-faint">{s.note}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {s.keys.map((k) => (
                  <kbd key={k} className="px-2 py-1 rounded-lg border border-line2 bg-card-raised font-mono text-[11px] text-text2-muted">
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
