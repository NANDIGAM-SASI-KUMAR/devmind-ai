import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Upload, FileText, Trash2, CheckCircle2,
  XCircle, Search, Sparkles, AlertCircle
} from 'lucide-react';
import AppShell from '../components/shell/AppShell.jsx';
import { studyPlansAPI } from '../api/studyPlans.js';
import StudyPlanTab from '../components/studyplan/StudyPlanTab.jsx';
import QuizzesTab from '../components/studyplan/QuizzesTab.jsx';
import ProgressTab from '../components/studyplan/ProgressTab.jsx';
import ExamsTab from '../components/studyplan/ExamsTab.jsx';

const LEVEL_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function StudyPlanDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [materials, setMaterials] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('materials');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [query, setQuery] = useState('');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [askError, setAskError] = useState('');
  const inputRef = useRef(null);

  const load = async () => {
    try {
      const [p, m] = await Promise.all([studyPlansAPI.get(id), studyPlansAPI.listMaterials(id)]);
      setPlan(p);
      setMaterials(m);
    } catch (err) {
      console.error(err);
      navigate('/study-plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const material = await studyPlansAPI.uploadMaterial(id, file);
      setMaterials((m) => [material, ...(m || [])]);
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMaterial = async (materialId) => {
    await studyPlansAPI.deleteMaterial(id, materialId);
    setMaterials((m) => m.filter((x) => x._id !== materialId));
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setAsking(true);
    setAskError('');
    setAnswer(null);
    try {
      const result = await studyPlansAPI.ask(id, query);
      setAnswer(result);
    } catch (err) {
      setAskError(err.response?.data?.message || 'Could not get an answer');
    } finally {
      setAsking(false);
    }
  };

  const readyCount = materials?.filter((m) => m.status === 'ready').length || 0;

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
      <main className="h-full overflow-y-auto px-6 md:px-10 py-10 max-w-[820px] mx-auto">
        <Link to="/study-plans" className="inline-flex items-center gap-1.5 text-sm text-text2-faint hover:text-text2 transition-colors mb-6">
          <ArrowLeft className="w-3.5 h-3.5" />
          Study plans
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-text2 tracking-tight">{plan?.name}</h1>
          <span className="px-2.5 py-1 rounded-lg text-xs font-medium text-brand-soft bg-brand/10 border border-brand/25">
            {LEVEL_LABEL[plan?.understandingLevel]}
          </span>
        </div>
        <p className="text-text2-muted mb-6">
          {readyCount === 0 ? 'Upload your course material to get started.' : `${readyCount} document${readyCount === 1 ? '' : 's'} ready for retrieval.`}
        </p>

        <div className="flex items-center gap-1 mb-8">
          <TabButton active={tab === 'materials'} onClick={() => setTab('materials')}>Materials</TabButton>
          <TabButton active={tab === 'plan'} onClick={() => setTab('plan')}>Study plan</TabButton>
          <TabButton active={tab === 'quizzes'} onClick={() => setTab('quizzes')}>Quizzes</TabButton>
          <TabButton active={tab === 'progress'} onClick={() => setTab('progress')}>Progress</TabButton>
          <TabButton active={tab === 'exams'} onClick={() => setTab('exams')}>Examinations</TabButton>
        </div>

        {tab === 'plan' && <StudyPlanTab plan={plan} readyCount={readyCount} onPlanUpdated={setPlan} />}
        {tab === 'quizzes' && <QuizzesTab planId={id} readyCount={readyCount} />}
        {tab === 'progress' && <ProgressTab planId={id} />}
        {tab === 'exams' && <ExamsTab planId={id} readyCount={readyCount} />}

        {tab === 'materials' && (
        <>
        {/* Upload */}
        <input ref={inputRef} type="file" onChange={handleUpload} className="hidden" accept=".pdf,.docx,.txt,.md" />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-2xl border border-dashed border-line2-strong text-text2-muted hover:text-text2 hover:border-brand/50 hover:bg-card-hover transition-colors mb-3 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? 'Processing…' : 'Upload course material (PDF, DOCX, TXT, MD — up to 10MB)'}
        </button>
        {uploadError && (
          <div className="rounded-xl border border-state-danger/30 bg-state-danger/10 px-3.5 py-2.5 text-state-danger text-sm mb-4">
            {uploadError}
          </div>
        )}

        {/* Materials list */}
        <div className="space-y-1.5 mb-10">
          {materials?.map((m) => (
            <div key={m._id} className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-card border border-line2">
              <FileText className="w-4 h-4 text-text2-faint flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text2 truncate">{m.originalName}</p>
                <p className="text-xs text-text2-faint">
                  {formatSize(m.size)}
                  {m.status === 'ready' && ` · ${m.chunkCount} chunk${m.chunkCount === 1 ? '' : 's'} embedded`}
                  {m.status === 'failed' && ` · ${m.error}`}
                </p>
              </div>
              {m.status === 'processing' && <Loader2 className="w-4 h-4 text-text2-faint animate-spin flex-shrink-0" />}
              {m.status === 'ready' && <CheckCircle2 className="w-4 h-4 text-state-success flex-shrink-0" />}
              {m.status === 'failed' && <XCircle className="w-4 h-4 text-state-danger flex-shrink-0" />}
              <button
                onClick={() => handleDeleteMaterial(m._id)}
                aria-label="Delete material"
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-text2-faint hover:text-state-danger hover:bg-state-danger/10 transition-all flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Ask your materials */}
        <div className="bg-card border border-line2 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-brand-soft" />
            <h2 className="font-heading text-lg font-bold text-text2">Ask your materials</h2>
          </div>
          <p className="text-sm text-text2-faint mb-4">
            Ask anything about the uploaded documents and get a direct answer, grounded in what you actually uploaded.
          </p>

          <form onSubmit={handleAsk} className="flex gap-2 mb-4">
            <div className="field-shell flex-1 rounded-xl flex items-center gap-2.5 px-3.5 py-2.5">
              <Search className="w-4 h-4 text-text2-faint flex-shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. what is my name?"
                className="w-full bg-transparent text-sm text-text2 placeholder:text-text2-faint focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={asking || !query.trim() || readyCount === 0}
              className="btn-brand px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ask'}
            </button>
          </form>

          {askError && (
            <div className="flex items-center gap-2 rounded-xl border border-state-danger/30 bg-state-danger/10 px-3.5 py-2.5 text-state-danger text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {askError}
            </div>
          )}

          {answer && (
            <div className="rounded-xl bg-card-raised border border-line2 p-4">
              <p className="text-sm text-text2 leading-relaxed whitespace-pre-wrap">{answer.answer}</p>
              {answer.sources?.length > 0 && (
                <p className="text-xs text-text2-faint mt-3 pt-3 border-t border-line2">
                  Source{answer.sources.length > 1 ? 's' : ''}: {answer.sources.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>
        </>
        )}
      </main>
    </AppShell>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
        active ? 'bg-card-raised text-text2 border border-line2' : 'text-text2-faint hover:text-text2'
      }`}
    >
      {children}
    </button>
  );
}
