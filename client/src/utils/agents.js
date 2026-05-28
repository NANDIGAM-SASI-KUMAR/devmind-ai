import { Compass, Hammer, SearchCode, ScrollText, Bot } from 'lucide-react';

export const AGENT_META = {
  planner: {
    label: 'Planner',
    role: 'The Architect',
    color: '#D4FF3A',
    icon: Compass,
    n: '01'
  },
  coder: {
    label: 'Coder',
    role: 'The Craftsman',
    color: '#FF6B35',
    icon: Hammer,
    n: '02'
  },
  debugger: {
    label: 'Debugger',
    role: 'The Detective',
    color: '#FFB627',
    icon: SearchCode,
    n: '03'
  },
  docs: {
    label: 'Docs',
    role: 'The Scribe',
    color: '#5B8FE5',
    icon: ScrollText,
    n: '04'
  }
};

export const getAgentMeta = (name) =>
  AGENT_META[name] || { label: 'Assistant', role: 'Auto', color: '#B8AE9C', icon: Bot, n: '··' };
