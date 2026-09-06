import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Circle, Pencil, Check, X, Settings2, Paperclip, ListTodo } from 'lucide-react';
import { projectsAPI } from '../api/projects.js';
import { conversationsAPI } from '../api/conversations.js';
import { streamChatMessage, regenerateMessage, editChatMessage } from '../api/chat.js';
import MessageList from '../components/chat/MessageList.jsx';
import MessageInput from '../components/chat/MessageInput.jsx';
import AgentPicker from '../components/chat/AgentPicker.jsx';
import AppShell from '../components/shell/AppShell.jsx';
import ProjectInstructionsModal from '../components/dashboard/ProjectInstructionsModal.jsx';
import ProjectFilesModal from '../components/dashboard/ProjectFilesModal.jsx';
import ProjectTasksModal from '../components/dashboard/ProjectTasksModal.jsx';
import { AGENT_META } from '../utils/agents.js';

const STARTERS = [
  { agent: 'planner', text: 'Help me plan a SaaS that lets freelancers track invoices. Break it down into milestones.' },
  { agent: 'coder', text: 'Write a clean React login form with email/password validation using Tailwind.' },
  { agent: 'debugger', text: "I'm getting 'Cannot read property map of undefined' in my Express handler. How do I find the cause?" },
  { agent: 'docs', text: 'Write a polished README for a Node.js library that converts markdown to PDF.' }
];

export default function ChatPage() {
  const { projectId, conversationId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [agentOverride, setAgentOverride] = useState(null);
  const [activeAgent, setActiveAgent] = useState(null);
  const [streamingText, setStreamingText] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [p, conv, msgs] = await Promise.all([
          projectsAPI.get(projectId),
          conversationsAPI.get(conversationId),
          conversationsAPI.messages(conversationId)
        ]);
        setProject(p);
        setConversation(conv);
        setMessages(msgs);
      } catch (err) {
        console.error(err);
        navigate(`/project/${projectId}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, conversationId, navigate]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  // Shared SSE-event handling for send / edit / regenerate — they all stream the
  // same event shape, differing only in the API call and how the local list mutates.
  const runStream = useCallback(async (apiCall, { onUserSaved } = {}) => {
    setStreaming(true);
    setStreamingText('');
    setActiveAgent(null);

    let accumulated = '';
    let chosenAgent = null;

    try {
      await apiCall({
        onEvent: (event) => {
          if (event.type === 'agent_selected') {
            chosenAgent = event.agent;
            setActiveAgent(event.agent);
          } else if (event.type === 'user_message_saved') {
            if (event.title) setConversation((c) => (c ? { ...c, title: event.title } : c));
            onUserSaved?.(event);
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
              { _id: 'err-' + Date.now(), role: 'assistant', agent: null, content: `⚠️ ${event.message}`, createdAt: new Date().toISOString() }
            ]);
            setStreamingText('');
            setActiveAgent(null);
          }
        }
      });
    } catch (err) {
      setMessages((m) => [
        ...m,
        { _id: 'err-' + Date.now(), role: 'assistant', agent: null, content: `⚠️ ${err.message}`, createdAt: new Date().toISOString() }
      ]);
    } finally {
      setStreaming(false);
      setStreamingText('');
      setActiveAgent(null);
    }
  }, []);

  const handleSend = useCallback(
    (text) => {
      if (!text.trim() || streaming) return;
      setMessages((m) => [...m, { _id: 'temp-' + Date.now(), role: 'user', content: text, createdAt: new Date().toISOString() }]);
      return runStream((opts) => streamChatMessage({ conversationId, message: text, agent: agentOverride, ...opts }));
    },
    [conversationId, agentOverride, streaming, runStream]
  );

  const handleExplainCode = useCallback(
    (code, language) => {
      handleSend(`Explain this ${language || ''} code:\n\n\`\`\`${language || ''}\n${code}\n\`\`\``);
    },
    [handleSend]
  );

  const handleRegenerateMessage = useCallback(
    (messageId, agent) => {
      if (streaming) return;
      setMessages((m) => m.filter((msg) => msg._id !== messageId));
      return runStream((opts) => regenerateMessage({ conversationId, messageId, agent, ...opts }));
    },
    [conversationId, streaming, runStream]
  );

  const handleEditMessage = useCallback(
    (messageId, content) => {
      if (!content.trim() || streaming) return;
      const tempId = 'temp-' + Date.now();
      setMessages((m) => {
        const idx = m.findIndex((msg) => msg._id === messageId);
        const before = idx >= 0 ? m.slice(0, idx) : m;
        return [...before, { _id: tempId, role: 'user', content, createdAt: new Date().toISOString() }];
      });
      return runStream(
        (opts) => editChatMessage({ conversationId, messageId, content, agent: agentOverride, ...opts }),
        { onUserSaved: (event) => setMessages((m) => m.map((msg) => (msg._id === tempId ? { ...msg, _id: event.messageId } : msg))) }
      );
    },
    [conversationId, agentOverride, streaming, runStream]
  );

  const startEditTitle = () => {
    setTitleDraft(conversation?.title || '');
    setEditingTitle(true);
  };

  const saveTitle = async () => {
    const title = titleDraft.trim();
    setEditingTitle(false);
    if (!title || title === conversation?.title) return;
    try {
      const updated = await conversationsAPI.update(conversationId, { title });
      setConversation(updated);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="h-full flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-brand" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="h-full flex flex-col p-3 md:p-4 gap-3">
        {/* ============ TOP BAR — floating rounded panel ============ */}
        <header className="flex-shrink-0 rounded-2xl border border-line2 bg-card/90 backdrop-blur shadow-lg shadow-black/20 overflow-hidden sticky top-3 z-30">
          <div className="flex items-center justify-between gap-4 px-4 md:px-6 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                to="/projects"
                className="p-2 rounded-xl text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors flex-shrink-0"
                title="Back to projects"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="min-w-0">
                {editingTitle ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      autoFocus
                      value={titleDraft}
                      onChange={(e) => setTitleDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveTitle();
                        if (e.key === 'Escape') setEditingTitle(false);
                      }}
                      className="font-heading text-base font-bold text-text2 bg-card-hover rounded-lg px-2 py-1 focus:outline-none w-full max-w-xs"
                    />
                    <button onClick={saveTitle} aria-label="Save title" className="p-1.5 rounded-lg text-state-success hover:bg-state-success/10">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingTitle(false)} aria-label="Cancel title edit" className="p-1.5 rounded-lg text-text2-faint hover:bg-card-hover">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button onClick={startEditTitle} className="group flex items-center gap-1.5 min-w-0">
                    <h1 className="font-heading text-base font-bold text-text2 truncate">{conversation?.title}</h1>
                    <Pencil className="w-3 h-3 text-text2-faint opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </button>
                )}
                <p className="text-xs text-text2-faint truncate">{project?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowTasks(true)}
                aria-label="Open tasks"
                className="p-2 rounded-xl text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors"
                title="Tasks"
              >
                <ListTodo className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowFiles(true)}
                aria-label="Open project files"
                className="p-2 rounded-xl text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors"
                title="Project files"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowInstructions(true)}
                aria-label="Open project instructions"
                className="p-2 rounded-xl text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors"
                title="Project instructions"
              >
                <Settings2 className="w-4 h-4" />
              </button>
              <AgentPicker value={agentOverride} onChange={setAgentOverride} />
            </div>
          </div>

          <div className="hidden md:flex items-center justify-between px-6 py-2 bg-card-raised text-xs text-text2-faint">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5">
                <Circle className="w-2 h-2 fill-state-success text-state-success" />
                Session live
              </span>
              <span>{messages.length} {messages.length === 1 ? 'message' : 'messages'}</span>
              {project?.tech?.length > 0 && <span>{project.tech.join(' · ')}</span>}
            </div>
            <span>{agentOverride ? `${AGENT_META[agentOverride]?.label} mode` : 'Auto mode — orchestrator selects the specialist'}</span>
          </div>
        </header>

        {/* ============ TRANSCRIPT — floating rounded panel ============ */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto rounded-2xl border border-line2 bg-card/40"
        >
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
            {messages.length === 0 && !streaming ? (
              <EmptyChat onPrompt={handleSend} />
            ) : (
              <MessageList
                messages={messages}
                streamingText={streamingText}
                activeAgent={activeAgent}
                isStreaming={streaming}
                onEditMessage={handleEditMessage}
                onRegenerateMessage={handleRegenerateMessage}
                onExplainCode={handleExplainCode}
              />
            )}
          </div>
        </div>

        {/* ============ INPUT — floating rounded command bar ============ */}
        <div className="flex-shrink-0 max-w-3xl w-full mx-auto">
          <MessageInput onSend={handleSend} disabled={streaming} />
        </div>
      </div>

      {showInstructions && project && (
        <ProjectInstructionsModal
          project={project}
          onClose={() => setShowInstructions(false)}
          onSave={async (instructions) => {
            const updated = await projectsAPI.update(projectId, { instructions });
            setProject(updated);
          }}
        />
      )}

      {showFiles && <ProjectFilesModal projectId={projectId} onClose={() => setShowFiles(false)} />}
      {showTasks && <ProjectTasksModal projectId={projectId} onClose={() => setShowTasks(false)} />}
    </AppShell>
  );
}

function EmptyChat({ onPrompt }) {
  return (
    <div className="py-8 auth-fade-in">
      <div className="mb-10">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-text2 mb-2">What shall we build?</h2>
        <p className="text-text2-muted">Type a message below, or begin with one of these openers.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {STARTERS.map((s, i) => {
          const meta = AGENT_META[s.agent];
          const Icon = meta.icon;
          return (
            <button
              key={i}
              onClick={() => onPrompt(s.text)}
              className="group text-left bg-card border border-line2 rounded-2xl p-5 hover:border-line2-strong hover:bg-card-hover transition-all"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${meta.color}22` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} strokeWidth={2.2} />
                </div>
                <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
              </div>
              <p className="text-sm text-text2-muted leading-relaxed group-hover:text-text2 transition-colors">
                {s.text}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
