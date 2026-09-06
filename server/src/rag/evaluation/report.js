const pct = (v) => (v === null || v === undefined ? 'n/a' : `${Math.round(v * 100)}%`);
const num = (v, decimals = 2) => (v === null || v === undefined ? 'n/a' : v.toFixed(decimals));
const ms = (v) => (v === null || v === undefined ? 'n/a' : `${v}ms`);

// Formats a real, measured baseline-vs-advanced comparison — every value here comes
// directly from runEvaluation() results, nothing is invented to fill the table.
export const formatComparisonReport = (baselineResult, advancedResult) => {
  const b = baselineResult.aggregate;
  const a = advancedResult.aggregate;
  const row = (label, fmt, key) => `${label.padEnd(20)} ${fmt(b[key]).padEnd(12)} ${fmt(a[key])}`;

  return [
    '                     BASELINE     ADVANCED',
    '-----------------------------------------------',
    row('Recall@1', pct, 'recallAt1'),
    row('Recall@5', pct, 'recallAt5'),
    row('Recall@10', pct, 'recallAt10'),
    row('MRR', num, 'mrr'),
    row('nDCG@10', num, 'ndcgAt10'),
    row('Refusal correctness', pct, 'refusalCorrectness'),
    row('Citation accuracy', pct, 'citationAccuracy'),
    row('Answer relevance', pct, 'answerRelevance'),
    row('Avg latency', ms, 'avgLatencyMs'),
    row('P50 latency', ms, 'p50LatencyMs'),
    row('P95 latency', ms, 'p95LatencyMs')
  ].join('\n');
};
