import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { LogOut, ChevronUp, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProfileMenu({ variant = 'sidebar' }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const compact = variant === 'compact';

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    window.addEventListener('resize', () => setOpen(false));
    return () => {
      document.removeEventListener('mousedown', handler);
    };
  }, []);

  const toggleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      if (compact) {
        setCoords({ right: window.innerWidth - rect.right, top: rect.bottom + 8, width: 220 });
      } else {
        setCoords({ left: rect.left, bottom: window.innerHeight - rect.top + 8, width: rect.width });
      }
    }
    setOpen((o) => !o);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className={compact ? '' : 'flex-shrink-0'}>
      <button
        ref={btnRef}
        onClick={toggleOpen}
        aria-label={compact ? 'Profile menu' : undefined}
        className={
          compact
            ? 'flex items-center gap-2 p-1 pr-2.5 rounded-xl border border-line2 bg-card/90 backdrop-blur hover:bg-card-hover transition-colors shadow-lg shadow-black/20'
            : 'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-card-hover transition-colors'
        }
      >
        <div className={`rounded-lg bg-brand flex items-center justify-center text-white font-bold flex-shrink-0 ${compact ? 'w-8 h-8 text-sm' : 'w-7 h-7 text-xs'}`}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        {!compact && <span className="text-sm text-text2-muted truncate flex-1 text-left">{user?.name}</span>}
        {compact
          ? <ChevronDown className={`w-3.5 h-3.5 text-text2-faint transition-transform ${open ? 'rotate-180' : ''}`} />
          : <ChevronUp className={`w-3.5 h-3.5 text-text2-faint transition-transform flex-shrink-0 ${open ? '' : 'rotate-180'}`} />}
      </button>

      {open && coords && createPortal(
        <div
          ref={menuRef}
          style={{ position: 'fixed', zIndex: 9999, width: coords.width, ...(compact ? { right: coords.right, top: coords.top } : { left: coords.left, bottom: coords.bottom }) }}
          className="min-w-[200px] rounded-2xl border border-line2 bg-card-raised shadow-xl shadow-black/40 p-1.5 auth-fade-in"
        >
          <div className="px-3 py-2.5">
            <p className="text-sm font-semibold text-text2 truncate">{user?.name}</p>
            <p className="text-xs text-text2-faint truncate">{user?.email}</p>
          </div>
          <div className="h-px bg-line2 mx-1.5 my-1"></div>
          <button
            onClick={() => { setOpen(false); navigate('/profile'); }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-state-danger hover:bg-state-danger/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
