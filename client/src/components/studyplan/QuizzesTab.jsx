import { useEffect, useState } from 'react';
import { Loader2, ListChecks, Sparkles, AlertCircle, ChevronRight } from 'lucide-react';
import { studyPlansAPI } from '../../api/studyPlans.js';
import { quizzesAPI } from '../../api/quizzes.js';
import QuizRunner from './QuizRunner.jsx';

export default function QuizzesTab({ planId, readyCount }) {
  const [quizzes, setQuizzes] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [opening, setOpening] = useState(null);

  const load = async () => {
    try {
      setQuizzes(await studyPlansAPI.listQuizzes(planId));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { load(); }, [planId]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const quiz = await studyPlansAPI.generateQuiz(planId);
      setQuizzes((q) => [{ _id: quiz._id, title: quiz.title, createdAt: quiz.createdAt, questionCount: quiz.questions.length }, ...(q || [])]);
      setActiveQuiz(quiz);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate a quiz right now.');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpen = async (id) => {
    setOpening(id);
    try {
      setActiveQuiz(await quizzesAPI.get(id));
    } catch (err) {
      setError(err.response?.data?.message || 'Could not open this quiz right now.');
    } finally {
      setOpening(null);
    }
  };

  if (activeQuiz) {
    return <QuizRunner quiz={activeQuiz} onExit={() => { setActiveQuiz(null); load(); }} />;
  }

  if (readyCount === 0) {
    return (
      <div className="bg-card border border-line2 rounded-2xl p-8 text-center">
        <ListChecks className="w-8 h-8 text-text2-faint mx-auto mb-3" />
        <p className="text-sm text-text2-muted">Upload course material first — quizzes are generated from what you actually upload.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-card border border-line2 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ListChecks className="w-4 h-4 text-brand-soft" />
              <h2 className="font-heading text-lg font-bold text-text2">Quizzes</h2>
            </div>
            <p className="text-sm text-text2-faint">Test yourself with questions generated from your uploaded material.</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="btn-brand px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Generating…' : 'New quiz'}
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-state-danger/30 bg-state-danger/10 px-3.5 py-2.5 text-state-danger text-sm mt-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}
      </div>

      {quizzes === null ? (
        <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div>
      ) : quizzes.length === 0 ? (
        <p className="text-sm text-text2-faint text-center py-6">No quizzes yet — generate one above.</p>
      ) : (
        <div className="space-y-1.5">
          {quizzes.map((q) => (
            <button
              key={q._id}
              onClick={() => handleOpen(q._id)}
              disabled={opening === q._id}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-line2 hover:bg-card-hover transition-colors text-left disabled:opacity-60"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-text2 truncate">{q.title}</p>
                <p className="text-xs text-text2-faint">
                  {q.questionCount} question{q.questionCount === 1 ? '' : 's'} · {new Date(q.createdAt).toLocaleDateString()}
                </p>
              </div>
              {opening === q._id ? <Loader2 className="w-4 h-4 animate-spin text-text2-faint" /> : <ChevronRight className="w-4 h-4 text-text2-faint" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
