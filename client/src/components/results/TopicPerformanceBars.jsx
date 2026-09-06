const barColor = (pct) => (pct >= 75 ? 'bg-state-success' : pct >= 50 ? 'bg-state-warning' : 'bg-state-danger');

export default function TopicPerformanceBars({ topics, onTopicClick }) {
  return (
    <div className="space-y-3">
      {topics.map((t) => (
        <button
          key={t.topic}
          onClick={() => onTopicClick?.(t.topic)}
          className="w-full text-left group"
        >
          <div className="flex items-center justify-between mb-1.5 text-sm">
            <span className="text-text2 group-hover:text-brand-soft transition-colors">{t.topic}</span>
            <span className="text-text2-faint">{t.percentage}% ({t.total} questions)</span>
          </div>
          <div className="h-2 rounded-full bg-card-raised overflow-hidden">
            <div className={`h-full rounded-full ${barColor(t.percentage)}`} style={{ width: `${t.percentage}%` }} />
          </div>
        </button>
      ))}
    </div>
  );
}
