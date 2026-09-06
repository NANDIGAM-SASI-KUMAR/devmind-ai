import { useState, useEffect, useRef } from 'react';
import { diffLines } from 'diff';
import {
  X, Loader2, FileText, Trash2, Upload, Search, Sparkles,
  History, Check, ChevronDown, ChevronRight, RotateCcw
} from 'lucide-react';
import { filesAPI } from '../../api/files.js';

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ProjectFilesModal({ projectId, onClose }) {
  const [tab, setTab] = useState('files');
  const [files, setFiles] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [expandedFile, setExpandedFile] = useState(null);
  const inputRef = useRef(null);

  const loadFiles = async () => {
    try { setFiles(await filesAPI.list(projectId)); } catch (err) { console.error(err); }
  };

  useEffect(() => { loadFiles(); }, [projectId]);

  useEffect(() => {
    const handler = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const uploaded = await filesAPI.upload(projectId, file);
      setFiles((fs) => [uploaded, ...(fs || [])]);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await filesAPI.remove(fileId);
      setFiles((fs) => fs.filter((f) => f._id !== fileId));
      if (expandedFile === fileId) setExpandedFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete file');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-xl auth-card rounded-2xl shadow-2xl shadow-black/50 auth-fade-in max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-1 flex-shrink-0">
          <h2 className="font-heading text-xl font-bold text-text2">Project files</h2>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg text-text2-faint hover:text-text2 hover:bg-card-hover transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 px-6 pt-3 flex-shrink-0">
          <TabButton active={tab === 'files'} onClick={() => setTab('files')}>Files</TabButton>
          <TabButton active={tab === 'search'} onClick={() => setTab('search')}>
            <Search className="w-3.5 h-3.5" /> Search code
          </TabButton>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          {tab === 'files' ? (
            <>
              <p className="text-sm text-text2-faint mb-4">
                Uploaded files are read by every specialist as context, and indexed for semantic search. Code, config, and markdown files up to 1MB.
              </p>

              <input ref={inputRef} type="file" onChange={handleUpload} className="hidden" />
              <button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-line2-strong text-text2-muted hover:text-text2 hover:border-brand/50 hover:bg-card-hover transition-colors mb-4 disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Uploading…' : 'Upload a file'}
              </button>

              {error && (
                <div className="rounded-xl border border-state-danger/30 bg-state-danger/10 px-3.5 py-2.5 text-state-danger text-sm mb-4">
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                {files === null ? (
                  <p className="text-sm text-text2-faint text-center py-6">Loading…</p>
                ) : files.length === 0 ? (
                  <p className="text-sm text-text2-faint text-center py-6">No files yet.</p>
                ) : (
                  files.map((file) => (
                    <FileRow
                      key={file._id}
                      file={file}
                      expanded={expandedFile === file._id}
                      onToggle={() => setExpandedFile(expandedFile === file._id ? null : file._id)}
                      onDelete={() => handleDelete(file._id)}
                      onFileUpdated={(updated) => setFiles((fs) => fs.map((f) => (f._id === updated._id ? updated : f)))}
                    />
                  ))
                )}
              </div>
            </>
          ) : (
            <SearchTab projectId={projectId} />
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
        active ? 'bg-card-raised text-text2 border border-line2' : 'text-text2-faint hover:text-text2'
      }`}
    >
      {children}
    </button>
  );
}

function SearchTab({ projectId }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { results } = await filesAPI.searchCode(projectId, query);
      setResults(results);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-text2-faint mb-4">
        Ask about your codebase in plain language — retrieval runs on real embeddings of your uploaded files.
      </p>
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="field-shell flex-1 rounded-xl flex items-center gap-2.5 px-3.5 py-2.5">
          <Search className="w-4 h-4 text-text2-faint flex-shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. where is authentication handled?"
            className="w-full bg-transparent text-sm text-text2 placeholder:text-text2-faint focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={searching || !query.trim()}
          className="btn-brand px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 flex-shrink-0"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
        </button>
      </form>

      {results !== null && (
        <div className="space-y-2">
          {results.length === 0 ? (
            <p className="text-sm text-text2-faint">No matches. Have you uploaded any files yet?</p>
          ) : (
            results.map((r, i) => (
              <div key={i} className="rounded-xl bg-card-raised border border-line2 p-3.5">
                <p className="text-xs font-medium text-brand-soft mb-1.5">{r.metadata?.originalName}</p>
                <pre className="text-xs text-text2-muted leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto">{r.text}</pre>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function FileRow({ file, expanded, onToggle, onDelete, onFileUpdated }) {
  return (
    <div className="rounded-xl bg-card-raised border border-line2 overflow-hidden">
      <div className="group flex items-center gap-2 px-3 py-2.5">
        <button onClick={onToggle} aria-label={expanded ? 'Collapse file' : 'Expand file'} className="text-text2-faint hover:text-text2 flex-shrink-0">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <FileText className="w-4 h-4 text-text2-faint flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-text2 truncate">{file.originalName}</p>
          <p className="text-xs text-text2-faint">{formatSize(file.size)}</p>
        </div>
        <button
          onClick={onDelete}
          aria-label="Delete file"
          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text2-faint hover:text-state-danger hover:bg-state-danger/10 transition-all flex-shrink-0"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {expanded && <FileEditPanel file={file} onFileUpdated={onFileUpdated} />}
    </div>
  );
}

function FileEditPanel({ file, onFileUpdated }) {
  const [mode, setMode] = useState('propose'); // 'propose' | 'history'
  const [instruction, setInstruction] = useState('');
  const [proposing, setProposing] = useState(false);
  const [proposal, setProposal] = useState(null); // { oldContent, newContent }
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [checkpoints, setCheckpoints] = useState(null);
  const [restoringId, setRestoringId] = useState(null);

  const loadCheckpoints = async () => {
    try { setCheckpoints(await filesAPI.listCheckpoints(file._id)); } catch (err) { console.error(err); }
  };

  const switchMode = (m) => {
    setMode(m);
    if (m === 'history' && checkpoints === null) loadCheckpoints();
  };

  const handlePropose = async (e) => {
    e.preventDefault();
    if (!instruction.trim()) return;
    setError('');
    setProposing(true);
    setProposal(null);
    try {
      const result = await filesAPI.proposeEdit(file._id, instruction.trim());
      setProposal(result);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate a proposal');
    } finally {
      setProposing(false);
    }
  };

  const handleAccept = async () => {
    setApplying(true);
    try {
      const { file: updated } = await filesAPI.applyEdit(file._id, proposal.newContent);
      onFileUpdated(updated);
      setProposal(null);
      setInstruction('');
      setCheckpoints(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not apply the change');
    } finally {
      setApplying(false);
    }
  };

  const handleRestore = async (checkpointId) => {
    setRestoringId(checkpointId);
    try {
      const { file: updated } = await filesAPI.restoreCheckpoint(file._id, checkpointId);
      onFileUpdated(updated);
      await loadCheckpoints();
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="border-t border-line2 bg-card p-3.5">
      <div className="flex items-center gap-1 mb-3">
        <SmallTab active={mode === 'propose'} onClick={() => switchMode('propose')}>
          <Sparkles className="w-3 h-3" /> Propose edit
        </SmallTab>
        <SmallTab active={mode === 'history'} onClick={() => switchMode('history')}>
          <History className="w-3 h-3" /> History
        </SmallTab>
      </div>

      {mode === 'propose' ? (
        <div>
          {!proposal ? (
            <form onSubmit={handlePropose} className="flex gap-2">
              <input
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Describe the change you want…"
                className="field-shell flex-1 rounded-lg px-3 py-2 text-xs text-text2 placeholder:text-text2-faint focus:outline-none"
              />
              <button
                type="submit"
                disabled={proposing || !instruction.trim()}
                className="btn-brand px-3 py-2 rounded-lg text-white text-xs font-semibold disabled:opacity-40 flex-shrink-0"
              >
                {proposing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Generate'}
              </button>
            </form>
          ) : (
            <div>
              <DiffView oldContent={proposal.oldContent} newContent={proposal.newContent} />
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleAccept}
                  disabled={applying}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-state-success hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Accept
                </button>
                <button
                  onClick={() => setProposal(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-text2-muted hover:text-text2 hover:bg-card-hover transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          )}
          {error && <p className="text-xs text-state-danger mt-2">{error}</p>}
        </div>
      ) : (
        <div className="space-y-1.5">
          {checkpoints === null ? (
            <p className="text-xs text-text2-faint">Loading…</p>
          ) : checkpoints.length === 0 ? (
            <p className="text-xs text-text2-faint">No checkpoints yet — they're created automatically before any accepted edit.</p>
          ) : (
            checkpoints.map((cp) => (
              <div key={cp._id} className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-card-hover">
                <span className="text-xs text-text2-muted">{cp.label}</span>
                <button
                  onClick={() => handleRestore(cp._id)}
                  disabled={restoringId === cp._id}
                  className="flex items-center gap-1 text-xs text-brand-soft hover:text-brand-glow transition-colors disabled:opacity-50 flex-shrink-0"
                >
                  {restoringId === cp._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                  Restore
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SmallTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
        active ? 'bg-card-hover text-text2' : 'text-text2-faint hover:text-text2'
      }`}
    >
      {children}
    </button>
  );
}

function DiffView({ oldContent, newContent }) {
  const parts = diffLines(oldContent, newContent);
  return (
    <pre className="text-xs font-mono rounded-lg border border-line2 overflow-x-auto max-h-64 overflow-y-auto">
      {parts.map((part, i) => (
        <div
          key={i}
          className={
            part.added ? 'bg-state-success/10 text-state-success' : part.removed ? 'bg-state-danger/10 text-state-danger' : 'text-text2-muted'
          }
        >
          {part.value.split('\n').filter((_, idx, arr) => !(idx === arr.length - 1 && part.value.endsWith('\n'))).map((line, li) => (
            <div key={li} className="px-3 whitespace-pre">
              {part.added ? '+ ' : part.removed ? '- ' : '  '}{line}
            </div>
          ))}
        </div>
      ))}
    </pre>
  );
}
