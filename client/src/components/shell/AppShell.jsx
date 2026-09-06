import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar.jsx';
import SearchModal from './SearchModal.jsx';

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="h-screen flex mesh-bg overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onSearch={() => setSearchOpen(true)} />

      <button
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
        className="md:hidden fixed top-6 left-6 z-30 p-2.5 rounded-xl border border-line2 bg-card/90 backdrop-blur text-text2-muted shadow-lg shadow-black/20"
      >
        <Menu className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0 h-full overflow-hidden">{children}</div>

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
