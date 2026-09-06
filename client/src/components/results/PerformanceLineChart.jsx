const KIND_COLOR = { quiz: '#38BDF8', exam: '#F472B6' };

export default function PerformanceLineChart({ points }) {
  if (points.length === 0) return null;

  const W = 720;
  const H = 220;
  const PAD_L = 34;
  const PAD_B = 28;
  const PAD_T = 12;
  const plotW = W - PAD_L - 12;
  const plotH = H - PAD_T - PAD_B;

  const xFor = (i) => PAD_L + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const yFor = (score) => PAD_T + plotH - (score / 100) * plotH;

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i)} ${yFor(p.score)}`).join(' ');
  const gridLines = [0, 25, 50, 75, 100];

  const labelStep = Math.max(1, Math.ceil(points.length / 6));

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 480 }} preserveAspectRatio="xMidYMid meet">
        {gridLines.map((g) => (
          <g key={g}>
            <line x1={PAD_L} x2={W - 12} y1={yFor(g)} y2={yFor(g)} stroke="#22242F" strokeWidth="1" />
            <text x={PAD_L - 8} y={yFor(g) + 3} textAnchor="end" fontSize="10" fill="#5B5F70">{g}</text>
          </g>
        ))}

        <path d={linePath} fill="none" stroke="#818CF8" strokeWidth="2" />

        {points.map((p, i) => (
          <g key={i}>
            <circle cx={xFor(i)} cy={yFor(p.score)} r="4" fill={KIND_COLOR[p.kind] || '#818CF8'} stroke="#111219" strokeWidth="1.5">
              <title>{new Date(p.date).toLocaleDateString()} · {p.kind} · {p.score}%</title>
            </circle>
            {i % labelStep === 0 && (
              <text x={xFor(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#5B5F70">
                {new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </text>
            )}
          </g>
        ))}
      </svg>

      <div className="flex items-center gap-4 mt-2 px-1">
        <span className="flex items-center gap-1.5 text-xs text-text2-faint">
          <span className="w-2 h-2 rounded-full" style={{ background: KIND_COLOR.quiz }} /> Quiz
        </span>
        <span className="flex items-center gap-1.5 text-xs text-text2-faint">
          <span className="w-2 h-2 rounded-full" style={{ background: KIND_COLOR.exam }} /> Exam
        </span>
      </div>
    </div>
  );
}
