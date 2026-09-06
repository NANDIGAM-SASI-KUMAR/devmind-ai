import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowRight, Search, ChevronDown, Menu, X, SearchCode, Mail, GraduationCap,
  Compass, Hammer, ScrollText, ShieldCheck, FlaskConical, Bot, Info, Sparkles,
  ClipboardCheck, LineChart
} from 'lucide-react';

const SEARCH_ITEMS = [
  { label: 'Home', keywords: 'home landing top start', type: 'route', target: '/', icon: Sparkles, desc: 'Back to the top of the page' },
  { label: 'AI Agents', keywords: 'agents specialists orchestrator team workspace', type: 'anchor', target: 'agents', icon: Bot, desc: 'Meet the six specialist agents' },
  { label: 'Planner', keywords: 'planner architect plan implementation epics', type: 'anchor', target: 'agents', icon: Compass, desc: 'Turns ideas into implementation plans' },
  { label: 'Coder', keywords: 'coder craftsman code writing', type: 'anchor', target: 'agents', icon: Hammer, desc: 'Writes production-ready code file by file' },
  { label: 'Debugger', keywords: 'debugger detective bug fix stack trace', type: 'anchor', target: 'agents', icon: SearchCode, desc: 'Finds the real issue beneath the symptom' },
  { label: 'Documentation', keywords: 'docs documenter scribe readme', type: 'anchor', target: 'agents', icon: ScrollText, desc: 'Turns code into clear documentation' },
  { label: 'Reviewer', keywords: 'reviewer guardian code review diff', type: 'anchor', target: 'agents', icon: ShieldCheck, desc: 'Reviews diffs like a senior engineer' },
  { label: 'Tester', keywords: 'tester examiner tests qa edge cases', type: 'anchor', target: 'agents', icon: FlaskConical, desc: 'Writes the tests your code actually needs' },
  { label: 'How it works', keywords: 'workflow process steps orchestrator routing', type: 'anchor', target: 'how-it-works', icon: ArrowRight, desc: 'How DevMind routes each request' },
  { label: 'Study plans', keywords: 'study plans learning quiz materials rag upload', type: 'anchor', target: 'study-plans', icon: GraduationCap, desc: 'Source-grounded study plans and quizzes' },
  { label: 'Examinations', keywords: 'examinations exams test timer weak areas assessment', type: 'anchor', target: 'examinations', icon: ClipboardCheck, desc: 'Timed, source-grounded exams with weak-area detection' },
  { label: 'Results', keywords: 'results analytics dashboard performance insights progress', type: 'anchor', target: 'results', icon: LineChart, desc: 'Performance analytics across quizzes and exams' },
  { label: 'About us', keywords: 'about company mission why devmind', type: 'anchor', target: 'about', icon: Info, desc: 'What DevMind is and why it exists' },
  { label: 'Contact us', keywords: 'contact email message support help', type: 'modal', target: 'contact', icon: Mail, desc: 'Send us a message' },
  { label: 'Free audit', keywords: 'audit free review code check security', type: 'modal', target: 'audit', icon: SearchCode, desc: 'Get a free AI code review, no signup' },
  { label: 'Sign in', keywords: 'login signin account existing', type: 'route', target: '/login', icon: ArrowRight, desc: 'Sign in to your account' },
  { label: 'Start your project', keywords: 'signup start project get started free account', type: 'route', target: '/signup', icon: ArrowRight, desc: 'Create your free account' }
];

const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const scoreMatch = (item, q) => {
  const label = item.label.toLowerCase();
  if (label === q) return 0;
  if (label.startsWith(q)) return 1;
  if (label.includes(q)) return 2;
  if (item.keywords.includes(q)) return 3;
  return -1;
};

const Highlight = ({ text, query }) => {
  if (!query) return text;
  const re = new RegExp(`(${escapeRegExp(query)})`, 'ig');
  const parts = text.split(re);
  return parts.map((part, i) =>
    re.test(part) && part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-brand/30 text-text2 rounded-sm px-0.5">{part}</mark>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

function goToAnchor(id) {
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export default function LandingHeader({ onOpenContact, onOpenAudit }) {
  const navigate = useNavigate();
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const servicesRef = useRef(null);
  const searchRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileMenuBtnRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const mobileSearchBtnRef = useRef(null);
  const searchInputRef = useRef(null);
  const mobileSearchInputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (servicesRef.current && !servicesRef.current.contains(e.target)) setServicesOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        !mobileMenuBtnRef.current?.contains(e.target)
      ) setMobileMenuOpen(false);
      if (
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target) &&
        !mobileSearchBtnRef.current?.contains(e.target)
      ) setMobileSearchOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) mobileSearchInputRef.current?.focus();
  }, [mobileSearchOpen]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return SEARCH_ITEMS.map((item) => ({ item, score: scoreMatch(item, q) }))
      .filter((r) => r.score >= 0)
      .sort((a, b) => a.score - b.score)
      .map((r) => r.item);
  }, [query]);

  useEffect(() => setActiveIndex(0), [query]);

  const executeItem = (item) => {
    if (!item) return;
    if (item.type === 'route') navigate(item.target);
    else if (item.type === 'anchor') {
      if (window.location.pathname !== '/') navigate('/', { replace: false });
      goToAnchor(item.target);
    } else if (item.type === 'modal') {
      if (item.target === 'contact') onOpenContact();
      if (item.target === 'audit') onOpenAudit();
    }
    setQuery('');
    setSearchOpen(false);
    setMobileSearchOpen(false);
    searchInputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, matches.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (matches.length > 0) executeItem(matches[activeIndex] || matches[0]); }
    else if (e.key === 'Escape') { setSearchOpen(false); setMobileSearchOpen(false); e.currentTarget.blur(); }
  };

  const SearchResults = () => (
    <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl border border-line2 bg-card-raised shadow-xl shadow-black/40 p-1.5 auth-fade-in z-30 max-h-[60vh] overflow-y-auto">
      {matches.length === 0 ? (
        <p className="px-3.5 py-4 text-sm text-text2-faint text-center">No results found</p>
      ) : (
        matches.map((item, i) => (
          <button
            key={item.label}
            type="button"
            onMouseEnter={() => setActiveIndex(i)}
            onClick={() => executeItem(item)}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors ${
              i === activeIndex ? 'bg-card-hover text-text2' : 'text-text2-muted hover:bg-card-hover hover:text-text2'
            }`}
          >
            <item.icon className="w-4 h-4 text-brand-soft flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate"><Highlight text={item.label} query={query} /></p>
              <p className="text-xs text-text2-faint truncate">{item.desc}</p>
            </div>
          </button>
        ))
      )}
    </div>
  );

  return (
    <div className="sticky top-0 z-40 px-4 md:px-6 pt-4 pb-2">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex items-center gap-2 md:gap-3 rounded-full border border-line2 bg-card/90 backdrop-blur-xl shadow-lg shadow-black/30 pl-3 pr-2 md:pl-4 md:pr-2.5 py-2">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg btn-brand flex items-center justify-center text-white font-heading font-extrabold text-xs">
              dm
            </div>
            <span className="hidden sm:block font-heading font-bold text-text2 text-base">DevMind</span>
          </Link>

          {/* Divider */}
          <div className="hidden md:block w-px h-6 bg-line2 flex-shrink-0" />

          {/* Nav links (desktop) */}
          <div className="hidden md:flex items-center gap-6 text-sm text-text2-muted flex-shrink-0 px-1">
            <Link to="/" className="hover:text-text2 transition-colors">Home</Link>
            <div ref={servicesRef} className="relative">
              <button
                onClick={() => setServicesOpen((o) => !o)}
                className="flex items-center gap-1 hover:text-text2 transition-colors"
              >
                Services
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`} />
              </button>
              {servicesOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 rounded-2xl border border-line2 bg-card-raised shadow-xl shadow-black/40 p-1.5 auth-fade-in z-30">
                  <a
                    href="#agents"
                    onClick={() => setServicesOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors"
                  >
                    <Hammer className="w-3.5 h-3.5 text-brand-soft" />
                    Coding projects
                  </a>
                  <a
                    href="#study-plans"
                    onClick={() => setServicesOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors"
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-specialist-docs" />
                    Study plans
                  </a>
                  <a
                    href="#examinations"
                    onClick={() => setServicesOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors"
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 text-specialist-reviewer" />
                    Examinations
                  </a>
                  <a
                    href="#results"
                    onClick={() => setServicesOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors"
                  >
                    <LineChart className="w-3.5 h-3.5 text-specialist-tester" />
                    Results
                  </a>
                </div>
              )}
            </div>
            <a href="#about" className="hover:text-text2 transition-colors">About us</a>
            <button onClick={onOpenContact} className="hover:text-text2 transition-colors">Contact us</button>
          </div>

          {/* Search (desktop) */}
          <div ref={searchRef} className="hidden md:block relative flex-1 min-w-0">
            <div className={`flex items-center gap-2 rounded-full bg-card-raised border transition-colors px-3.5 py-2 ${searchOpen ? 'border-brand/50' : 'border-line2'}`}>
              <Search className="w-3.5 h-3.5 text-text2-faint flex-shrink-0" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => query && setSearchOpen(true)}
                onKeyDown={handleKeyDown}
                placeholder="Search DevMind…"
                aria-label="Search DevMind"
                className="w-full bg-transparent text-sm text-text2 placeholder:text-text2-faint focus:outline-none"
              />
            </div>
            {searchOpen && query.trim() && <SearchResults />}
          </div>

          {/* Actions (desktop) */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            <Link to="/login" className="px-3 py-2 text-sm font-medium text-text2-muted hover:text-text2 transition-colors">
              Sign in
            </Link>
            <button
              onClick={onOpenAudit}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-line2 bg-card text-text2-muted hover:text-text2 hover:border-line2-strong transition-colors text-sm font-medium whitespace-nowrap"
            >
              <SearchCode className="w-3.5 h-3.5" />
              Free audit
            </button>
            <Link
              to="/signup"
              className="btn-brand group flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-sm font-semibold whitespace-nowrap"
            >
              Start your project
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile: search icon + hamburger */}
          <div className="flex md:hidden items-center gap-1 ml-auto flex-shrink-0">
            <button
              ref={mobileSearchBtnRef}
              onClick={() => setMobileSearchOpen((o) => !o)}
              aria-label="Search"
              className="p-2 rounded-full text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
            <button
              ref={mobileMenuBtnRef}
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="Menu"
              className="p-2 rounded-full text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile search bar (expands below header) */}
        {mobileSearchOpen && (
          <div ref={mobileSearchRef} className="md:hidden mt-2 rounded-2xl border border-line2 bg-card-raised shadow-xl shadow-black/40 p-2 auth-fade-in relative">
            <div className="flex items-center gap-2 rounded-xl bg-card px-3.5 py-2.5 border border-line2">
              <Search className="w-3.5 h-3.5 text-text2-faint flex-shrink-0" />
              <input
                ref={mobileSearchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search DevMind…"
                aria-label="Search DevMind"
                className="w-full bg-transparent text-sm text-text2 placeholder:text-text2-faint focus:outline-none"
              />
            </div>
            {query.trim() && (
              <div className="mt-2 max-h-[50vh] overflow-y-auto">
                {matches.length === 0 ? (
                  <p className="px-3.5 py-4 text-sm text-text2-faint text-center">No results found</p>
                ) : (
                  matches.map((item, i) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => executeItem(item)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-colors ${
                        i === activeIndex ? 'bg-card-hover text-text2' : 'text-text2-muted hover:bg-card-hover hover:text-text2'
                      }`}
                    >
                      <item.icon className="w-4 h-4 text-brand-soft flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate"><Highlight text={item.label} query={query} /></p>
                        <p className="text-xs text-text2-faint truncate">{item.desc}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div ref={mobileMenuRef} className="md:hidden mt-2 rounded-2xl border border-line2 bg-card-raised shadow-xl shadow-black/40 p-2 auth-fade-in space-y-0.5">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block px-3.5 py-2.5 rounded-xl text-sm text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors">Home</Link>
            <p className="px-3.5 pt-2 pb-1 text-[11px] font-medium tracking-wide text-text2-faint uppercase">Services</p>
            <a href="#agents" onClick={() => setMobileMenuOpen(false)} className="block px-3.5 py-2.5 rounded-xl text-sm text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors">Coding projects</a>
            <a href="#study-plans" onClick={() => setMobileMenuOpen(false)} className="block px-3.5 py-2.5 rounded-xl text-sm text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors">Study plans</a>
            <a href="#examinations" onClick={() => setMobileMenuOpen(false)} className="block px-3.5 py-2.5 rounded-xl text-sm text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors">Examinations</a>
            <a href="#results" onClick={() => setMobileMenuOpen(false)} className="block px-3.5 py-2.5 rounded-xl text-sm text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors">Results</a>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block px-3.5 py-2.5 rounded-xl text-sm text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors">About us</a>
            <button onClick={() => { setMobileMenuOpen(false); onOpenContact(); }} className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors">Contact us</button>
            <div className="h-px bg-line2 my-1.5" />
            <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block px-3.5 py-2.5 rounded-xl text-sm text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors">Sign in</Link>
            <button onClick={() => { setMobileMenuOpen(false); onOpenAudit(); }} className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors">
              <SearchCode className="w-3.5 h-3.5" />
              Free audit
            </button>
            <Link
              to="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-brand flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-white text-sm font-semibold mt-1"
            >
              Start your project
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
