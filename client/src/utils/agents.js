import { Compass, Hammer, SearchCode, ScrollText, ShieldCheck, FlaskConical, Bot } from 'lucide-react';

export const AGENT_META = {
  planner: {
    label: 'Planner',
    role: 'The Architect',
    color: '#818CF8',
    className: 'specialist-planner',
    icon: Compass,
    n: '01'
  },
  coder: {
    label: 'Coder',
    role: 'The Craftsman',
    color: '#38BDF8',
    className: 'specialist-coder',
    icon: Hammer,
    n: '02'
  },
  debugger: {
    label: 'Debugger',
    role: 'The Detective',
    color: '#FB923C',
    className: 'specialist-debugger',
    icon: SearchCode,
    n: '03'
  },
  docs: {
    label: 'Docs',
    role: 'The Scribe',
    color: '#2DD4BF',
    className: 'specialist-docs',
    icon: ScrollText,
    n: '04'
  },
  reviewer: {
    label: 'Reviewer',
    role: 'The Guardian',
    color: '#F472B6',
    className: 'specialist-reviewer',
    icon: ShieldCheck,
    n: '05'
  },
  tester: {
    label: 'Tester',
    role: 'The Examiner',
    color: '#22D3EE',
    className: 'specialist-tester',
    icon: FlaskConical,
    n: '06'
  }
};

export const getAgentMeta = (name) =>
  AGENT_META[name] || { label: 'Assistant', role: 'Auto', color: '#9195A5', className: 'text2-muted', icon: Bot, n: '··' };
