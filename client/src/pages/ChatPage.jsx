import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { projectsAPI } from '../api/projects.js';
import { streamChatMessage } from '../api/chat.js';
import MessageList from '../components/chat/MessageList.jsx';
import MessageInput from '../components/chat/MessageInput.jsx';
import AgentPicker from '../components/chat/AgentPicker.jsx';
import { AGENT_META } from '../utils/agents.js';

const STARTERS = [
  { agent: 'planner', text: 'Help me plan a SaaS that lets freelancers track invoices. Break it down into milestones.' },
  { agent: 'coder', text: 'Write a clean React login form with email/password validation using Tailwind.' },
  { agent: 'debugger', text: "I'm getting 'Cannot read property map of undefined' in my Express handler. How do I find the cause?" },
  { agent: 'docs', text: 'Write a polished README for a Node.js library that converts markdown to PDF.' }
];

export default function ChatPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [agentOverride, setAgentOverride] = useState(null);
  const [activeAgent, setActiveAgent] = useState(null);
  const [streamingText, setStreamingText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [p, msgs] = await Promise.all([projectsAPI.get(id), projectsAPI.messages(id)]);
        setProject(p);
        setMessages(msgs);
      } catch (err) {
        console.error(err);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  const handleSend = useCallback(
    async (text) => {
      if (!text.trim() || streaming) return;
      const userMsg = {
        _id: 'temp-' + Date.now(),
        role: 'user',
        content: text,
        createdAt: new Date().toISOString()
      };
      setMessages((m) => [...m, userMsg]);
      setStreaming(true);
      setStreamingText('');
      setActiveAgent(null);

      let accumulated = '';
      let chosenAgent = null;

      try {
        await streamChatMessage({
          projectId: id,
          message: text,
          agent: agentOverride,
          onEvent: (event) => {
            if (event.type === 'agent_selected') {
              chosenAgent = event.agent;
              setActiveAgent(event.agent);
            } else if (event.type === 'chunk') {
              accumulated += event.text;
              setStreamingText(accumulated);
            } else if (event.type === 'done') {
              setMessages((m) => [
                ...m,
                {
                  _id: event.messageId || 'temp-assist-' + Date.now(),
                  role: 'assistant',
                  agent: chosenAgent,
                  content: accumulated,
                  createdAt: new Date().toISOString()
                }
              ]);
              setStreamingText('');
              setActiveAgent(null);
            } else if (event.type === 'error') {
              setMessages((m) => [
                ...m,
                {
                  _id: 'err-' + Date.now(),
                  role: 'assistant',
                  agent: null,
                  content: `⚠️ ${event.message}`,
                  createdAt: new Date().toISOString()
                }
              ]);
              setStreamingText('');
              setActiveAgent(null);
            }
          }
        });
      } catch (err) {
        setMessages((m) => [
          ...m,
          {
            _id: 'err-' + Date.now(),
            role: 'assistant',
            agent: null,
            content: `⚠️ ${err.message}`,
            createdAt: new Date().toISOString()
          }
        ]);
      } finally {
        setStreaming(false);
        setStreamingText('');
        setActiveAgent(null);
      }
    },
    [id, agentOverride, streaming]
  );

  if (loading) {
    return (
      <div className="min-h-screen atmosphere flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-signal" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col atmosphere">
      {/* ============ TOP BAR ============ */}
      <header className="border-b border-rule bg-paper/95 backdrop-blur sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 md:px-8 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/dashboard"
              className="p-2 text-ink-faint hover:text-signal hover:bg-surface transition-colors flex-shrink-0"
              title="Back to archive"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            <div className="hairline-v h-6 hidden md:block"></div>

            <div className="flex items-center gap-3 min-w-0">
              <span
                className="numeral text-2xl md:text-3xl flex-shrink-0"
                style={{ color: project?.color }}
              >
                §
              </span>
              <div className="min-w-0">
                <h1 className="display text-xl md:text-2xl leading-tight truncate">
                  {project?.name}
                </h1>
                {project?.description && (
                  <p className="label-xs text-ink-faint truncate mt-0.5">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <AgentPicker value={agentOverride} onChange={setAgentOverride} />
        </div>

        {/* status bar */}
        <div className="hidden md:flex items-center justify-between px-8 py-1.5 border-t border-rule-subtle bg-surface/40">
          <div className="flex items-center gap-6 label-xs text-ink-faint">
            <span><span className="text-signal">●</span> SESSION LIVE</span>
            <span>{messages.length} {messages.length === 1 ? 'MESSAGE' : 'MESSAGES'}</span>
            {project?.tech?.length > 0 && (
              <span>STACK · {project.tech.join(' · ').toUpperCase()}</span>
            )}
          </div>
          <span className="label-xs text-ink-faint">
            DEVMIND · CHAT · LEAF Nº {String(messages.length).padStart(3, '0')}
          </span>
        </div>
      </header>

      {/* ============ TRANSCRIPT ============ */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
          {messages.length === 0 && !streaming ? (
            <EmptyChat onPrompt={handleSend} />
          ) : (
            <MessageList
              messages={messages}
              streamingText={streamingText}
              activeAgent={activeAgent}
              isStreaming={streaming}
            />
          )}
        </div>
      </div>

      {/* ============ INPUT ============ */}
      <div className="border-t border-rule bg-paper/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 md:px-8 py-4">
          <MessageInput onSend={handleSend} disabled={streaming} />
        </div>
      </div>
    </div>
  );
}

function EmptyChat({ onPrompt }) {
  return (
    <div className="py-12 animate-fade-in">
      <div className="mb-12 stagger">
        <div className="label-xs text-signal mb-3">§ NEW SESSION</div>
        <h2 className="display text-5xl md:text-6xl mb-3">
          What shall we <span className="display-italic">build</span>?
        </h2>
        <p className="text-ink-muted font-display italic text-lg max-w-lg leading-relaxed">
          Type a message below, or begin with one of these openers.
        </p>
      </div>

      <div className="hairline mb-px"></div>

      <div className="space-y-px bg-rule border-x border-b border-rule">
        {STARTERS.map((s, i) => {
          const meta = AGENT_META[s.agent];
          const Icon = meta.icon;
          return (
            <button
              key={i}
              onClick={() => onPrompt(s.text)}
              className="group w-full bg-paper hover:bg-surface transition-colors p-5 md:p-6 text-left"
              style={{ animation: `fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.08 + 0.2}s both` }}
            >
              <div className="flex items-start gap-5">
                <span className="numeral text-3xl md:text-4xl flex-shrink-0" style={{ color: meta.color }}>
                  {meta.n}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} strokeWidth={2} />
                    <span className="label-xs" style={{ color: meta.color }}>{meta.label}</span>
                    <span className="label-xs text-ink-faint">/ {meta.role}</span>
                  </div>
                  <p className="font-display italic text-lg md:text-xl text-ink-muted group-hover:text-ink transition-colors leading-snug">
                    "{s.text}"
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="dotted-rule mt-6"></div>
      <div className="flex justify-between mt-3 label-xs text-ink-faint">
        <span>OR · COMPOSE BELOW</span>
        <span>04 SUGGESTIONS</span>
      </div>
    </div>
  );
}
