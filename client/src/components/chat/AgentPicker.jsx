import { Sparkles } from 'lucide-react';
import { AGENT_META } from '../../utils/agents.js';

export default function AgentPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-2xl bg-card-raised border border-line2 overflow-x-auto">
      <SegmentButton active={!value} onClick={() => onChange(null)} color="#6366F1">
        <Sparkles className="w-3.5 h-3.5" />
        Auto
      </SegmentButton>

      {Object.entries(AGENT_META).map(([key, meta]) => {
        const Icon = meta.icon;
        return (
          <SegmentButton key={key} active={value === key} onClick={() => onChange(key)} color={meta.color}>
            <Icon className="w-3.5 h-3.5" />
            {meta.label}
          </SegmentButton>
        );
      })}
    </div>
  );
}

function SegmentButton({ active, onClick, color, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
        active ? 'text-white shadow-sm' : 'text-text2-muted hover:text-text2 hover:bg-card-hover'
      }`}
      style={active ? { backgroundColor: color } : undefined}
    >
      {children}
    </button>
  );
}
