import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const TICKER = [
  'PLANNER ↗',
  'CODER ↗',
  'DEBUGGER ↗',
  'DOCS ↗',
  'MULTI-AGENT ORCHESTRATION ↗',
  'CLAUDE-POWERED ↗',
  'BUILT ON MERN ↗',
  'REAL-TIME STREAMING ↗'
];

const AGENTS = [
  {
    n: '01',
    name: 'Planner',
    role: 'The Architect',
    desc: 'Translates raw intent into a structured roadmap. Breaks down ideas into epics, stories, and the first thing you should touch tomorrow morning.',
    color: '#D4FF3A'
  },
  {
    n: '02',
    name: 'Coder',
    role: 'The Craftsman',
    desc: 'Writes production-grade code, file by file. Idiomatic patterns, modern syntax, and short comments only where logic begs for them.',
    color: '#FF6B35'
  },
  {
    n: '03',
    name: 'Debugger',
    role: 'The Detective',
    desc: 'Reads stack traces like sheet music. Diagnoses the actual cause beneath the symptom, then hands you a fix and a prevention tip.',
    color: '#FFB627'
  },
  {
    n: '04',
    name: 'Docs',
    role: 'The Scribe',
    desc: 'Writes documentation worthy of the work. READMEs, API references, code comments — clear, opinionated, and free of bureaucratic fluff.',
    color: '#5B8FE5'
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen atmosphere overflow-x-hidden">
      {/* ============ TOP TICKER ============ */}
      <div className="border-b border-rule bg-paper relative overflow-hidden">
        <div className="marquee-mask py-2.5">
          <div className="marquee-track">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-12 px-6 label-xs text-ink-muted">
                {TICKER.map((t, j) => (
                  <span key={j} className="flex items-center gap-12">
                    <span>{t}</span>
                    <span className="text-signal">●</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ============ NAVBAR ============ */}
      <nav className="px-6 md:px-10 py-5 flex items-center justify-between border-b border-rule">
        <Link to="/" className="flex items-center gap-3">
          <span className="stamp text-signal">dm</span>
          <div>
            <div className="display text-lg leading-none">Dev<span className="display-italic">Mind</span></div>
            <div className="label-xs text-ink-faint mt-1">est. 2026 · an ai atelier</div>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <Link to="/login" className="px-4 py-2 label-xs text-ink-muted hover:text-ink transition-colors">
            Sign in
          </Link>
          <Link
            to="/signup"
            className="group flex items-center gap-2 px-4 py-2 bg-signal text-paper label-xs hover:bg-ink transition-colors"
          >
            Begin
            <ArrowUpRight className="w-3 h-3 group-hover:rotate-12 transition-transform" strokeWidth={2} />
          </Link>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <main className="px-6 md:px-10 py-16 md:py-24 max-w-[1400px] mx-auto">
        {/* Meta row */}
        <div className="grid grid-cols-12 gap-6 mb-12 stagger">
          <div className="col-span-12 md:col-span-3 label-xs text-ink-faint">
            VOL. 01 · ISSUE 04
          </div>
          <div className="col-span-12 md:col-span-6 label-xs text-ink-muted">
            <span className="text-signal">●</span>&nbsp;&nbsp;FOUR AGENTS · ONE INTERFACE · NO PERMISSION ASKED
          </div>
          <div className="col-span-12 md:col-span-3 label-xs text-ink-faint md:text-right">
            MAY 2026 EDITION
          </div>
        </div>

        <div className="hairline mb-12"></div>

        {/* HEADLINE */}
        <div className="grid grid-cols-12 gap-6 mb-16">
          <div className="col-span-12 md:col-span-10 stagger">
            <h1 className="display text-[14vw] md:text-[10.5vw] lg:text-[9.5rem] leading-[0.88]">
              <span className="block">An atelier of</span>
              <span className="block display-italic text-signal">small machines</span>
              <span className="block">that <span className="display-italic">build</span> with you.</span>
            </h1>
          </div>
          <div className="col-span-12 md:col-span-2 md:pt-4 stagger">
            <div className="label-xs text-ink-faint mb-2">A NOTE</div>
            <p className="text-sm text-ink-muted leading-relaxed font-display italic">
              "Four specialists. One conversation. Build like you have a team."
            </p>
          </div>
        </div>

        {/* Subhead + CTAs row */}
        <div className="grid grid-cols-12 gap-6 mb-20 items-end">
          <div className="col-span-12 md:col-span-7 stagger">
            <p className="text-xl md:text-2xl text-ink-muted leading-relaxed font-display italic max-w-2xl">
              DevMind orchestrates four agents — Planner, Coder, Debugger, Docs — through a single chat. Speak to one; the right one answers.
            </p>
          </div>
          <div className="col-span-12 md:col-span-5 flex flex-col md:items-end gap-3 stagger">
            <Link
              to="/signup"
              className="group inline-flex items-center justify-between gap-4 px-5 py-3 bg-signal text-paper hover:bg-ink transition-colors w-full md:w-auto md:min-w-[280px]"
            >
              <span className="label-xs">Step inside ·  free forever</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={2.5} />
            </Link>
            <Link
              to="/login"
              className="group inline-flex items-center justify-between gap-4 px-5 py-3 border border-rule-strong text-ink-muted hover:text-ink hover:border-ink transition-colors w-full md:w-auto md:min-w-[280px]"
            >
              <span className="label-xs">Already have a key? · sign in</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" strokeWidth={2} />
            </Link>
          </div>
        </div>

        {/* ============ AGENT TABLE OF CONTENTS ============ */}
        <div className="mb-10">
          <div className="flex items-baseline gap-4 mb-2">
            <span className="label-xs text-signal">§</span>
            <span className="label-xs text-ink-faint">The Cast · Four agents on call</span>
          </div>
          <div className="hairline"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-rule mb-20 border border-rule">
          {AGENTS.map((agent, i) => (
            <article
              key={agent.n}
              className="group relative bg-paper p-7 md:p-9 hover:bg-surface transition-colors duration-500"
              style={{ animation: `fadeUp 0.9s cubic-bezier(0.22, 1, 0.36, 1) ${i * 0.08 + 0.2}s both` }}
            >
              <div className="flex items-start justify-between mb-8">
                <span
                  className="numeral text-7xl md:text-8xl leading-none"
                  style={{ color: agent.color }}
                >
                  {agent.n}
                </span>
                <ArrowUpRight
                  className="w-5 h-5 text-ink-faint group-hover:text-signal group-hover:-translate-y-1 group-hover:translate-x-1 transition-all"
                  strokeWidth={1.5}
                />
              </div>

              <div className="flex items-baseline gap-3 mb-2">
                <h3 className="display text-3xl md:text-4xl">{agent.name}</h3>
                <span className="label-xs text-ink-faint">/ {agent.role}</span>
              </div>

              <p className="text-ink-muted leading-relaxed max-w-md">{agent.desc}</p>

              <div className="absolute bottom-0 left-0 h-px w-0 group-hover:w-full transition-all duration-700" style={{ background: agent.color }}></div>
            </article>
          ))}
        </div>

        {/* ============ HOW IT WORKS — editorial ============ */}
        <div className="grid grid-cols-12 gap-6 mb-20">
          <div className="col-span-12 md:col-span-3">
            <div className="flex items-baseline gap-4 mb-3">
              <span className="label-xs text-signal">§</span>
              <span className="label-xs text-ink-faint">The Process</span>
            </div>
            <h2 className="display text-4xl md:text-5xl mb-4">How it <span className="display-italic">works</span>.</h2>
            <p className="text-ink-muted text-sm leading-relaxed mb-4">
              No agent-juggling, no mode-switching, no manuals. You type, DevMind dispatches.
            </p>
          </div>

          <div className="col-span-12 md:col-span-9 space-y-px bg-rule border border-rule">
            {[
              { n: '01', title: 'You write.', body: 'Anything. A vague idea. A stack trace. A wish for documentation.' },
              { n: '02', title: 'The orchestrator listens.', body: 'A lightweight router classifies your intent and chooses the right agent for the work.' },
              { n: '03', title: 'The agent responds.', body: 'Streams back, token by token, in real time — with code blocks, markdown, syntax highlighting.' },
              { n: '04', title: 'You keep going.', body: 'Conversations and code are saved per project. Come back tomorrow, pick up mid-sentence.' }
            ].map((step, i) => (
              <div key={step.n} className="grid grid-cols-12 gap-4 bg-paper p-6 md:p-7 hover:bg-surface transition-colors">
                <div className="col-span-2 md:col-span-1 numeral text-3xl text-signal">{step.n}</div>
                <div className="col-span-10 md:col-span-4">
                  <h4 className="display text-2xl">{step.title}</h4>
                </div>
                <div className="col-span-12 md:col-span-7 text-ink-muted leading-relaxed md:pt-1">{step.body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ============ COLOPHON ============ */}
        <div className="grid grid-cols-12 gap-6 py-10 border-t border-rule">
          <div className="col-span-12 md:col-span-4">
            <div className="label-xs text-ink-faint mb-2">COLOPHON</div>
            <p className="text-ink-muted text-sm leading-relaxed">
              Set in <span className="font-display italic text-ink">Fraunces</span> and <span className="mono text-ink">JetBrains Mono</span>. Built with React, Express, MongoDB, and Anthropic's Claude.
            </p>
          </div>
          <div className="col-span-6 md:col-span-3">
            <div className="label-xs text-ink-faint mb-2">STACK</div>
            <ul className="space-y-1 text-sm text-ink-muted mono">
              <li>↳ MongoDB</li>
              <li>↳ Express</li>
              <li>↳ React 18</li>
              <li>↳ Node.js</li>
            </ul>
          </div>
          <div className="col-span-6 md:col-span-3">
            <div className="label-xs text-ink-faint mb-2">AI</div>
            <ul className="space-y-1 text-sm text-ink-muted mono">
              <li>↳ Claude Sonnet 4</li>
              <li>↳ SSE streaming</li>
              <li>↳ Smart routing</li>
              <li>↳ Tool-ready</li>
            </ul>
          </div>
          <div className="col-span-12 md:col-span-2 md:text-right">
            <div className="label-xs text-ink-faint mb-2">ISSUE</div>
            <div className="numeral text-5xl text-signal">04</div>
          </div>
        </div>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-rule">
        <div className="px-6 md:px-10 py-6 flex items-center justify-between max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3">
            <span className="stamp text-ink-muted">dm</span>
            <span className="label-xs text-ink-faint">© 2026 · A portfolio piece</span>
          </div>
          <div className="label-xs text-ink-faint">
            Made with care · <span className="text-signal">●</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
