import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Loader2, TrendingUp, ListChecks, ClipboardCheck, Award, Sparkles,
  CheckCircle2, AlertTriangle, Clock, ChevronRight, GraduationCap
} from 'lucide-react';
import AppShell from '../components/shell/AppShell.jsx';
import { resultsAPI } from '../api/results.js';
import PerformanceLineChart from '../components/results/PerformanceLineChart.jsx';
import TopicPerformanceBars from '../components/results/TopicPerformanceBars.jsx';
import TopicDetailModal from '../components/results/TopicDetailModal.jsx';

const RANGES = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '3m', label: '3 Months' },
  { value: 'all', label: 'All Time' }
];
const TYPES = [
  { value: 'all', label: 'All' },
  { value: 'quiz', label: 'Quizzes' },
  { value: 'exam', label: 'Examinations' }
];

const activityIcon = (type) => (type === 'quiz' ? ListChecks : type === 'exam' ? ClipboardCheck : Sparkles);

function MetricCard({ label, value, sub }) {
  return (
    <div className="bg-card border border-line2 rounded-2xl p-5">
      <p className="text-2xl font-heading font-extrabold text-text2">{value}</p>
      <p className="text-xs text-text2-faint mt-1">{label}</p>
      {sub && <p className="text-[11px] text-text2-faint mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, empty, hasData = true }) {
  return (
    <section className="bg-card border border-line2 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="w-4 h-4 text-brand-soft" />}
        <h2 className="font-heading text-sm font-bold text-text2-muted uppercase tracking-wide">{title}</h2>
      </div>
      {hasData ? children : <p className="text-sm text-text2-faint py-4">{empty}</p>}
    </section>
  );
}

export default function ResultsPage() {
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState(null);
  const [range, setRange] = useState('all');
  const [trendType, setTrendType] = useState('all');
  const [topicsData, setTopicsData] = useState(null);
  const [quizAnalytics, setQuizAnalytics] = useState(null);
  const [examAnalytics, setExamAnalytics] = useState(null);
  const [studyPlans, setStudyPlans] = useState(null);
  const [activity, setActivity] = useState(null);
  const [insights, setInsights] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    resultsAPI.overview().then(setOverview).catch(() => setOverview({ hasData: false }));
    resultsAPI.topics().then(setTopicsData).catch(() => setTopicsData({ hasData: false }));
    resultsAPI.quizAnalytics().then(setQuizAnalytics).catch(() => setQuizAnalytics({ hasData: false }));
    resultsAPI.examAnalytics().then(setExamAnalytics).catch(() => setExamAnalytics({ hasData: false }));
    resultsAPI.studyPlans().then(setStudyPlans).catch(() => setStudyPlans([]));
    resultsAPI.activity().then(setActivity).catch(() => setActivity([]));
    resultsAPI.insights().then(setInsights).catch(() => setInsights({ hasData: false }));
  }, []);

  useEffect(() => {
    setTrend(null);
    resultsAPI.trend(range, trendType).then(setTrend).catch(() => setTrend({ hasData: false, points: [] }));
  }, [range, trendType]);

  const loading = overview === null;

  if (loading) {
    return <AppShell><div className="h-full flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div></AppShell>;
  }

  return (
    <AppShell>
      <main className="h-full overflow-y-auto px-6 md:px-10 py-10 max-w-[1000px] mx-auto">
        <h1 className="font-heading text-3xl md:text-4xl font-extrabold text-text2 tracking-tight mb-2">Results</h1>
        <p className="text-text2-muted mb-8">Your learning and assessment performance, grounded in what you've actually done.</p>

        {!overview.hasData ? (
          <div className="bg-card border border-line2 rounded-2xl p-10 text-center">
            <Award className="w-8 h-8 text-text2-faint mx-auto mb-3" />
            <p className="text-sm text-text2-muted mb-1">No performance data yet.</p>
            <p className="text-sm text-text2-faint">Complete a quiz or examination to see analytics here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top summary metrics */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <MetricCard label="Overall progress" value={`${overview.overallProgress}%`} />
              <MetricCard label="Quiz accuracy" value={overview.quizAccuracy !== null ? `${overview.quizAccuracy}%` : '—'} sub={overview.quizAccuracy === null ? 'No quiz attempts yet' : null} />
              <MetricCard label="Exam average" value={overview.examAverage !== null ? `${overview.examAverage}%` : '—'} sub={overview.examAverage === null ? 'No examinations yet' : null} />
              <MetricCard label="Topics mastered" value={`${overview.topicsMastered.count} / ${overview.topicsMastered.total}`} />
              <MetricCard label="Quizzes completed" value={overview.quizzesCompleted} />
              <MetricCard label="Examinations completed" value={overview.examsCompleted} />
            </div>

            {/* Performance over time */}
            <SectionCard title="Performance over time" icon={TrendingUp} hasData={trend?.hasData} empty="Not enough data in this range yet.">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {RANGES.map((r) => (
                  <button key={r.value} onClick={() => setRange(r.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${range === r.value ? 'bg-brand/15 text-brand-soft border border-brand/30' : 'text-text2-faint hover:text-text2 border border-transparent'}`}>
                    {r.label}
                  </button>
                ))}
                <div className="w-px h-4 bg-line2 mx-1" />
                {TYPES.map((t) => (
                  <button key={t.value} onClick={() => setTrendType(t.value)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${trendType === t.value ? 'bg-brand/15 text-brand-soft border border-brand/30' : 'text-text2-faint hover:text-text2 border border-transparent'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
              {trend === null ? <div className="py-8 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-brand" /></div> : trend.hasData && <PerformanceLineChart points={trend.points} />}
            </SectionCard>

            {/* Topic performance */}
            <SectionCard title="Topic performance" icon={ListChecks} hasData={topicsData?.hasData} empty="No topic data yet.">
              {topicsData?.hasData && <TopicPerformanceBars topics={topicsData.topics} onTopicClick={setSelectedTopic} />}
            </SectionCard>

            {/* Strong / weak */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SectionCard title="Strong areas" icon={CheckCircle2} hasData={topicsData?.hasData && topicsData.strong.length > 0} empty="Not enough consistent data yet to call out strong areas.">
                <div className="space-y-2">
                  {topicsData?.strong.map((t) => (
                    <button key={t.topic} onClick={() => setSelectedTopic(t.topic)} className="w-full flex items-center justify-between text-sm text-left hover:text-brand-soft transition-colors">
                      <span className="flex items-center gap-1.5 text-text2"><CheckCircle2 className="w-3.5 h-3.5 text-state-success" /> {t.topic}</span>
                      <span className="text-text2-faint">{t.percentage}%</span>
                    </button>
                  ))}
                </div>
              </SectionCard>
              <SectionCard title="Areas to improve" icon={AlertTriangle} hasData={topicsData?.hasData && topicsData.weak.length > 0} empty="No consistently weak areas identified yet.">
                <div className="space-y-2">
                  {topicsData?.weak.map((t) => (
                    <button key={t.topic} onClick={() => setSelectedTopic(t.topic)} className="w-full text-left hover:text-brand-soft transition-colors">
                      <div className="flex items-center justify-between text-sm mb-0.5">
                        <span className="flex items-center gap-1.5 text-text2"><AlertTriangle className="w-3.5 h-3.5 text-state-warning" /> {t.topic}</span>
                        <span className="text-text2-faint">{t.percentage}%</span>
                      </div>
                      <p className="text-[11px] text-text2-faint pl-5">Based on {t.quizAttemptCount} quiz{t.quizAttemptCount === 1 ? '' : 'zes'}, {t.examAttemptCount} exam{t.examAttemptCount === 1 ? '' : 's'}</p>
                    </button>
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Quiz analytics */}
            <SectionCard title="Quiz performance" icon={ListChecks} hasData={quizAnalytics?.hasData} empty="No quiz attempts yet.">
              {quizAnalytics?.hasData && (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                    <MetricCard label="Average" value={`${quizAnalytics.averageScore}%`} />
                    <MetricCard label="Highest" value={`${quizAnalytics.highestScore}%`} />
                    <MetricCard label="Lowest" value={`${quizAnalytics.lowestScore}%`} />
                  </div>
                  {quizAnalytics.questionTypePerformance.length > 0 && (
                    <div className="grid grid-cols-3 gap-3">
                      {quizAnalytics.questionTypePerformance.map((t) => (
                        <div key={t.type} className="text-center">
                          <p className="text-lg font-heading font-bold text-text2">{t.percentage}%</p>
                          <p className="text-[11px] text-text2-faint capitalize">{t.type.replace('_', ' ')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-text2-muted uppercase tracking-wide mb-2">Recent attempts</p>
                    <div className="space-y-1">
                      {quizAnalytics.recentAttempts.map((a) => (
                        <Link key={a._id} to={a.studyPlan ? `/study-plans/${a.studyPlan._id}` : '/study-plans'} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-card-hover transition-colors text-sm">
                          <span className="text-text2-muted">{a.title}</span>
                          <span className="text-text2 font-medium">{a.score}%</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Exam analytics */}
            <SectionCard title="Examination performance" icon={ClipboardCheck} hasData={examAnalytics?.hasData} empty="No examinations completed yet.">
              {examAnalytics?.hasData && (
                <div className="space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                    <MetricCard label="Average" value={`${examAnalytics.averageScore}%`} />
                    <MetricCard label="Highest" value={`${examAnalytics.highestScore}%`} />
                    <MetricCard label="Latest" value={`${examAnalytics.latestScore}%`} />
                  </div>
                  {examAnalytics.improvement && (
                    <div className="flex items-center justify-center gap-3 text-sm bg-card-raised border border-line2 rounded-xl p-4">
                      <span className="text-text2-faint">First: <span className="text-text2 font-medium">{examAnalytics.improvement.firstExamScore}%</span></span>
                      <ChevronRight className="w-3.5 h-3.5 text-text2-faint" />
                      <span className="text-text2-faint">Latest: <span className="text-text2 font-medium">{examAnalytics.improvement.latestExamScore}%</span></span>
                      <span className={`font-semibold ${examAnalytics.improvement.delta >= 0 ? 'text-state-success' : 'text-state-danger'}`}>
                        {examAnalytics.improvement.delta >= 0 ? '+' : ''}{examAnalytics.improvement.delta} pts
                      </span>
                    </div>
                  )}
                  {examAnalytics.averageTimeSeconds !== null && (
                    <p className="flex items-center gap-1.5 text-xs text-text2-faint">
                      <Clock className="w-3.5 h-3.5" /> Average completion time: {Math.round(examAnalytics.averageTimeSeconds / 60)} min
                    </p>
                  )}
                  <div>
                    <p className="text-xs font-medium text-text2-muted uppercase tracking-wide mb-2">Recent examinations</p>
                    <div className="space-y-1">
                      {examAnalytics.recentAttempts.map((a) => (
                        <Link key={a._id} to={`/examinations/attempts/${a._id}/result`} className="flex items-center justify-between px-2 py-2 rounded-lg hover:bg-card-hover transition-colors text-sm">
                          <span className="text-text2-muted">{a.title}{a.autoSubmitted && ' (auto)'}</span>
                          <span className="text-text2 font-medium">{a.score}%</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* Study plan progress */}
            <SectionCard title="Study plan progress" icon={GraduationCap} hasData={studyPlans?.length > 0} empty="No study plans yet.">
              <div className="space-y-4">
                {studyPlans?.map((p) => (
                  <Link key={p._id} to={`/study-plans/${p._id}`} className="block bg-card-raised border border-line2 rounded-xl p-4 hover:border-line2-strong transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-text2">{p.name}</p>
                      <span className="text-xs text-text2-faint">{p.topicsPracticed}/{p.topicsTotal} topics</span>
                    </div>
                    {p.hasData ? (
                      <div className="flex items-center gap-4 text-xs text-text2-faint">
                        {p.quizAccuracy !== null && <span>Quiz: <span className="text-text2">{p.quizAccuracy}%</span></span>}
                        {p.examPerformance !== null && <span>Exam: <span className="text-text2">{p.examPerformance}%</span></span>}
                        {p.strong.length > 0 && <span>Strong: <span className="text-text2">{p.strong.join(', ')}</span></span>}
                        {p.weak.length > 0 && <span>Weak: <span className="text-text2">{p.weak.join(', ')}</span></span>}
                      </div>
                    ) : (
                      <p className="text-xs text-text2-faint">No quiz or exam data yet for this plan.</p>
                    )}
                  </Link>
                ))}
              </div>
            </SectionCard>

            {/* Recent activity */}
            <SectionCard title="Recent activity" icon={Clock} hasData={activity?.length > 0} empty="No recent activity yet.">
              <div className="space-y-1">
                {activity?.map((a, i) => {
                  const Icon = activityIcon(a.type);
                  return (
                    <Link key={i} to={a.link || '#'} className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-card-hover transition-colors">
                      <Icon className="w-3.5 h-3.5 text-brand-soft flex-shrink-0" />
                      <span className="text-sm text-text2-muted flex-1 min-w-0 truncate">{a.label}</span>
                      {a.score !== null && <span className="text-sm text-text2 font-medium flex-shrink-0">{a.score}%</span>}
                      <span className="text-xs text-text2-faint flex-shrink-0">{new Date(a.date).toLocaleDateString()}</span>
                    </Link>
                  );
                })}
              </div>
            </SectionCard>

            {/* AI insights */}
            <SectionCard title="AI performance insights" icon={Sparkles} hasData={insights?.hasData} empty="Complete more quizzes or examinations to unlock AI insights.">
              {insights?.hasData && (
                <div className="space-y-4">
                  <p className="text-sm text-text2 leading-relaxed">{insights.summary}</p>
                  {insights.trends?.length > 0 && (
                    <ul className="space-y-1.5">
                      {insights.trends.map((t, i) => <li key={i} className="text-sm text-text2-muted flex gap-2"><span className="text-brand-soft">→</span>{t}</li>)}
                    </ul>
                  )}
                  <div>
                    <p className="text-xs font-medium text-text2-muted uppercase tracking-wide mb-2">Recommended next steps</p>
                    <ol className="space-y-1.5">
                      {insights.recommendations.map((r, i) => (
                        <li key={i} className="text-sm text-text2-muted flex gap-2"><span className="text-brand-soft font-medium">{i + 1}.</span>{r}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </SectionCard>
          </div>
        )}
      </main>

      {selectedTopic && <TopicDetailModal topic={selectedTopic} onClose={() => setSelectedTopic(null)} />}
    </AppShell>
  );
}
