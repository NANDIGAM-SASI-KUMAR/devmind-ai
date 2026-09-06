import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Pin, PinOff, Archive, ArchiveRestore, Download, Pencil, Trash2, Loader2 } from 'lucide-react';

export default function ConversationMenu({ conversation, onRename, onTogglePin, onToggleArchive, onExport, onDelete }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
      setConfirming(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleOpen = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ left: rect.right - 200, top: rect.bottom + 4, width: 200 });
    }
    setConfirming(false);
    setOpen((o) => !o);
  };

  const close = () => { setOpen(false); setConfirming(false); };

  const run = async (fn) => {
    setBusy(true);
    try { await fn(); } finally { setBusy(false); close(); }
  };

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggleOpen}
        aria-label="More options"
        className="p-1 rounded text-text2-faint hover:text-text2 hover:bg-card transition-colors flex-shrink-0"
        title="More"
      >
        <MoreHorizontal className="w-3.5 h-3.5" />
      </button>

      {open && coords && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', left: coords.left, top: coords.top, width: coords.width, zIndex: 9999 }}
          onClick={(e) => e.stopPropagation()}
          className="rounded-xl border border-line2 bg-card-raised shadow-xl shadow-black/40 p-1.5 auth-fade-in"
        >
          {!confirming ? (
            <>
              <MenuItem icon={Pencil} label="Rename" onClick={() => { close(); onRename(); }} />
              <MenuItem
                icon={conversation.pinned ? PinOff : Pin}
                label={conversation.pinned ? 'Unpin' : 'Pin'}
                onClick={() => run(() => onTogglePin(conversation))}
                busy={busy}
              />
              <MenuItem
                icon={conversation.archived ? ArchiveRestore : Archive}
                label={conversation.archived ? 'Unarchive' : 'Archive'}
                onClick={() => run(() => onToggleArchive(conversation))}
                busy={busy}
              />
              <MenuItem icon={Download} label="Export as Markdown" onClick={() => run(() => onExport(conversation))} busy={busy} />
              <div className="h-px bg-line2 mx-1.5 my-1"></div>
              <MenuItem icon={Trash2} label="Delete" danger onClick={(e) => { e.stopPropagation(); setConfirming(true); }} />
            </>
          ) : (
            <div className="p-2">
              <p className="text-xs text-text2-muted mb-2.5 px-1">Move this conversation to trash?</p>
              <div className="flex gap-1.5">
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirming(false); }}
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-xs text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); run(() => onDelete(conversation)); }}
                  disabled={busy}
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white bg-state-danger hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : 'Delete'}
                </button>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger, busy }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 ${
        danger ? 'text-state-danger hover:bg-state-danger/10' : 'text-text2-muted hover:text-text2 hover:bg-card-hover'
      }`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {label}
    </button>
  );
}
