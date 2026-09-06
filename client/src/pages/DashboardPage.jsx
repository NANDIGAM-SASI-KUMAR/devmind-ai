import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUpRight, GraduationCap, Code2, ClipboardCheck, LineChart,
  ListChecks, Sparkles, CheckCircle2, AlertTriangle, Clock, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ProfileMenu from '../components/shell/ProfileMenu.jsx';
import { resultsAPI } from '../api/results.js';

const CARDS = [
  {
    to: '/projects', icon: Code2, title: 'Coding projects',
    iconBg: 'bg-brand/15', iconColor: 'text-brand-soft', arrowHover: 'group-hover:text-brand-soft',
    desc: 'Planner, Coder, Debugger, Docs, Reviewer and Tester working together on your codebase.'
  },
  {
    to: '/study-plans', icon: GraduationCap, title: 'Study plans',
    iconBg: 'bg-specialist-docs/15', iconColor: 'text-specialist-docs', arrowHover: 'group-hover:text-specialist-docs',
    desc: 'Upload course material and get a plan built from what you actually have to study.'
  },
  {
    to: '/examinations', icon: ClipboardCheck, title: 'Examinations',
    iconBg: 'bg-specialist-reviewer/15', iconColor: 'text-specialist-reviewer', arrowHover: 'group-hover:text-specialist-reviewer',
    desc: 'Timed, source-grounded exams from your study plans — with weak-area detection built in.'
  },
  {
    to: '/results', icon: LineChart, title: 'Results',
    iconBg: 'bg-specialist-tester/15', iconColor: 'text-specialist-tester', arrowHover: 'group-hover:text-specialist-tester',
    desc: 'Track your learning progress, quiz performance, examination results, weak areas, and improvement over time.'
  }
];

const activityIcon = (type) => (type === 'quiz' ? ListChecks : type === 'exam' ? ClipboardCheck : Sparkles);

export default function DashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [topics, setTopics] = useState(null);
  const [activity, setActivity] = useState(null);

  useEffect(() => {
    resultsAPI.overview().then(setOverview).catch(() => setOverview({ hasData: false }));
    resultsAPI.topics().then(setTopics).catch(() => setTopics({ hasData: false }));
    resultsAPI.activity().then(setActivity).catch(() => setActivity([]));
  }, []);

  return (
    <div className="min-h-screen mesh-bg">
      <header className="flex items-center justify-between px-6 md:px-10 py-6 max-w-[1000px] mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg btn-brand flex items-center justify-center text-white font-heading font-extrabold text-xs">
            dm
          </div>
          <span className="font-heading font-bold text-text2 text-base">DevMind</span>
        </div>
        <ProfileMenu variant="compact" />
      </header>

      <main className="px-6 md:px-10 py-10 md:py-16 max-w-[1000px] mx-auto">
        <p className="text-sm text-text2-faint mb-2">Welcome back, {user?.name?.split(' ')[0]}</p>
        <h1 className="font-heading text-4xl md:text-5xl font-extrabold text-text2 tracking-tight mb-10">
          What are you working on?
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {CARDS.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="group bg-card border border-line2 rounded-2xl p-6 hover:border-line2-strong hover:bg-card-hover transition-all flex flex-col"
            >
              <div className={`w-11 h-11 rounded-xl ${c.iconBg} flex items-center justify-center mb-5`}>
                <c.icon className={`w-5 h-5 ${c.iconColor}`} />
              </div>
              <h2 className="font-heading text-lg font-bold text-text2 mb-1.5 flex items-center gap-2">
                {c.title}
                <ArrowUpRight className={`w-4 h-4 text-text2-faint ${c.arrowHover} group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all`} />
              </h2>
              <p className="text-sm text-text2-muted">{c.desc}</p>
            </Link>
          ))}
        </div>

        {overview === null ? (
          <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div>
        ) : !overview.hasData ? (
          <div className="bg-card border border-line2 rounded-2xl p-8 text-center">
            <p className="text-sm text-text2-muted">Complete a quiz or examination to see your progress here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="font-heading text-xs font-bold text-text2-muted uppercase tracking-wide mb-3">Your progress</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-card border border-line2 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-heading font-extrabold text-text2">{overview.overallProgress}%</p>
                  <p className="text-xs text-text2-faint mt-1">Overall</p>
                </div>
                <div className="bg-card border border-line2 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-heading font-extrabold text-text2">{overview.quizAccuracy !== null ? `${overview.quizAccuracy}%` : '—'}</p>
                  <p className="text-xs text-text2-faint mt-1">Quiz accuracy</p>
                </div>
                <div className="bg-card border border-line2 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-heading font-extrabold text-text2">{overview.examAverage !== null ? `${overview.examAverage}%` : '—'}</p>
                  <p className="text-xs text-text2-faint mt-1">Exam average</p>
                </div>
                <div className="bg-card border border-line2 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-heading font-extrabold text-text2">{overview.topicsMastered.count}/{overview.topicsMastered.total}</p>
                  <p className="text-xs text-text2-faint mt-1">Topics mastered</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-line2 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-state-success" />
                  <h3 className="font-heading text-xs font-bold text-text2-muted uppercase tracking-wide">Strong areas</h3>
                </div>
                {topics?.hasData && topics.strong.length > 0 ? (
                  <div className="space-y-2">
                    {topics.strong.slice(0, 3).map((t) => (
                      <div key={t.topic} className="flex items-center justify-between text-sm">
                        <span className="text-text2">{t.topic}</span>
                        <span className="text-text2-faint">{t.percentage}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text2-faint">Not enough data yet.</p>
                )}
              </div>

              <div className="bg-card border border-line2 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-state-warning" />
                  <h3 className="font-heading text-xs font-bold text-text2-muted uppercase tracking-wide">Areas to improve</h3>
                </div>
                {topics?.hasData && topics.weak.length > 0 ? (
                  <div className="space-y-2">
                    {topics.weak.slice(0, 3).map((t) => (
                      <div key={t.topic} className="flex items-center justify-between text-sm">
                        <span className="text-text2">{t.topic}</span>
                        <span className="text-text2-faint">{t.percentage}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-text2-faint">No consistently weak areas identified yet.</p>
                )}
              </div>
            </div>

            <div className="bg-card border border-line2 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand-soft" />
                  <h3 className="font-heading text-xs font-bold text-text2-muted uppercase tracking-wide">Recent activity</h3>
                </div>
                <Link to="/results" className="text-xs text-brand-soft hover:text-brand-glow transition-colors">View all results</Link>
              </div>
              {activity?.length > 0 ? (
                <div className="space-y-1">
                  {activity.slice(0, 5).map((a, i) => {
                    const Icon = activityIcon(a.type);
                    return (
                      <Link key={i} to={a.link || '#'} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-card-hover transition-colors">
                        <Icon className="w-3.5 h-3.5 text-brand-soft flex-shrink-0" />
                        <span className="text-sm text-text2-muted flex-1 min-w-0 truncate">{a.label}</span>
                        {a.score !== null && <span className="text-sm text-text2 font-medium flex-shrink-0">{a.score}%</span>}
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text2-faint">No recent activity yet.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
