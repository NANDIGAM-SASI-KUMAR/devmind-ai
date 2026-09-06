import { Sparkles, Code2 } from 'lucide-react';

export default function OrchestratorPreview({ className = '' }) {
  return (
    <div className={`rounded-2xl border border-line2 bg-card/80 backdrop-blur overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-line2">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-line2-strong"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-line2-strong"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-line2-strong"></span>
        </div>
        <span className="text-xs font-medium text-text2-faint ml-1">DevMind workspace</span>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-xl rounded-tr-sm bg-card-hover border border-line2 px-3.5 py-2.5 text-sm text-text2">
            Build authentication for my application
          </div>
        </div>

        <div className="rounded-xl border border-specialist-orchestrator/25 bg-specialist-orchestrator/[0.06] px-4 py-3.5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-specialist-orchestrator" />
            <span className="text-xs font-semibold tracking-wide text-specialist-orchestrator">ORCHESTRATOR</span>
          </div>
          <div className="text-xs text-text2-muted leading-relaxed">
            Intent detected <span className="text-text2-faint">→</span> code generation
            <br />
            Routing to <span className="text-specialist-coder font-medium">Coder</span>
          </div>
        </div>

        <div className="rounded-xl border border-specialist-coder/25 bg-specialist-coder/[0.06] px-4 py-3.5">
          <div className="flex items-center gap-2 mb-1.5">
            <Code2 className="w-3.5 h-3.5 text-specialist-coder" />
            <span className="text-xs font-semibold tracking-wide text-specialist-coder">CODER</span>
            <span className="flex items-center gap-1 ml-auto text-[10px] text-text2-faint">
              <span className="w-1.5 h-1.5 rounded-full bg-specialist-coder animate-pulse-dot"></span>
              Working
            </span>
          </div>
          <div className="text-xs text-text2-faint font-mono">Generating auth middleware…</div>
        </div>
      </div>
    </div>
  );
}
