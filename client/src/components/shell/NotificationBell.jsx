import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ListChecks, CalendarDays, Sparkles, ClipboardCheck } from 'lucide-react';
import { notificationsAPI } from '../../api/notifications.js';

const TYPE_ICON = {
  task_completed: ClipboardCheck,
  study_plan_generated: CalendarDays,
  quiz_generated: ListChecks,
  project_plan_generated: Sparkles
};

const timeAgo = (date) => {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const load = async () => {
    try {
      const data = await notificationsAPI.list();
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch {
      // Silent — the bell simply shows no badge if notifications can't be fetched.
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const escHandler = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', escHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', escHandler);
    };
  }, []);

  const toggleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setCoords({ left: rect.left, bottom: window.innerHeight - rect.top + 8, width: 320 });
      load();
    }
    setOpen((o) => !o);
  };

  const handleItemClick = async (item) => {
    setOpen(false);
    if (!item.read) {
      setItems((its) => its.map((i) => (i._id === item._id ? { ...i, read: true } : i)));
      setUnreadCount((c) => Math.max(0, c - 1));
      notificationsAPI.markRead(item._id).catch(() => {});
    }
    if (item.link) navigate(item.link);
  };

  const handleMarkAllRead = async () => {
    setItems((its) => its.map((i) => ({ ...i, read: true })));
    setUnreadCount(0);
    try {
      await notificationsAPI.markAllRead();
    } catch {
      load();
    }
  };

  return (
    <div className="relative flex-shrink-0">
      <button
        ref={btnRef}
        onClick={toggleOpen}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand" aria-hidden="true" />
        )}
      </button>

      {open && coords && createPortal(
        <div
          ref={menuRef}
          role="menu"
          style={{ position: 'fixed', zIndex: 9999, left: coords.left, bottom: coords.bottom, width: coords.width }}
          className="rounded-2xl border border-line2 bg-card-raised shadow-xl shadow-black/40 p-1.5 auth-fade-in max-h-[70vh] flex flex-col"
        >
          <div className="flex items-center justify-between px-3 py-2 flex-shrink-0">
            <p className="text-sm font-semibold text-text2">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-text2-faint hover:text-text2 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>
          <div className="h-px bg-line2 mx-1.5 mb-1 flex-shrink-0"></div>

          <div className="overflow-y-auto flex-1 min-h-0">
            {items.length === 0 ? (
              <p className="px-3 py-6 text-sm text-text2-faint text-center">No notifications yet.</p>
            ) : (
              items.map((item) => {
                const Icon = TYPE_ICON[item.type] || Bell;
                return (
                  <button
                    key={item._id}
                    role="menuitem"
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors hover:bg-card-hover ${
                      !item.read ? 'bg-brand/5' : ''
                    }`}
                  >
                    <Icon className="w-4 h-4 text-brand-soft flex-shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-text2 truncate">{item.title}</p>
                      {item.message && <p className="text-xs text-text2-faint truncate">{item.message}</p>}
                      <p className="text-xs text-text2-faint mt-0.5">{timeAgo(item.createdAt)}</p>
                    </div>
                    {!item.read && <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0 mt-1.5" aria-hidden="true" />}
                  </button>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
