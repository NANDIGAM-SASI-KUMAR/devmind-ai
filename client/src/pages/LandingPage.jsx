import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Compass, Hammer, SearchCode, ScrollText, ShieldCheck, FlaskConical,
  Mail, GraduationCap, Upload, MessageSquareText, ListChecks, TrendingUp,
  ClipboardCheck, Timer, AlertTriangle, LineChart, BarChart3, CheckCircle2
} from 'lucide-react';
import OrchestratorPreview from '../components/shared/OrchestratorPreview.jsx';
import ContactModal from '../components/landing/ContactModal.jsx';
import FreeAuditModal from '../components/landing/FreeAuditModal.jsx';
import LandingHeader from '../components/landing/LandingHeader.jsx';

const SPECIALISTS = [
  {
    icon: Compass,
    name: 'Planner',
    role: 'The Architect',
    desc: 'Turns ideas into structured implementation plans — epics, stories, and the first thing to touch tomorrow morning.',
    iconClass: 'text-specialist-planner',
    bgClass: 'bg-specialist-planner/15'
  },
  {
    icon: Hammer,
    name: 'Coder',
    role: 'The Craftsman',
    desc: 'Writes production-ready code, file by file. Idiomatic patterns, modern syntax, comments only where logic needs them.',
    iconClass: 'text-specialist-coder',
    bgClass: 'bg-specialist-coder/15'
  },
  {
    icon: SearchCode,
    name: 'Debugger',
    role: 'The Detective',
    desc: 'Finds the real issue beneath the symptom, then hands you a fix and a prevention tip — not just a patch.',
    iconClass: 'text-specialist-debugger',
    bgClass: 'bg-specialist-debugger/15'
  },
  {
    icon: ScrollText,
    name: 'Documenter',
    role: 'The Scribe',
    desc: 'Turns code and architecture into clear documentation — READMEs, references, comments, free of bureaucratic fluff.',
    iconClass: 'text-specialist-docs',
    bgClass: 'bg-specialist-docs/15'
  },
  {
    icon: ShieldCheck,
    name: 'Reviewer',
    role: 'The Guardian',
    desc: 'Reads a diff the way a senior engineer would — flags real risks, skips the nitpicks, explains the why.',
    iconClass: 'text-specialist-reviewer',
    bgClass: 'bg-specialist-reviewer/15'
  },
  {
    icon: FlaskConical,
    name: 'Tester',
    role: 'The Examiner',
    desc: 'Writes the tests your code actually needs — edge cases, failure modes, and the assertions that would catch a regression.',
    iconClass: 'text-specialist-tester',
    bgClass: 'bg-specialist-tester/15'
  }
];

const STEPS = [
  { n: '01', title: 'Describe what you need', body: 'A vague idea, a stack trace, a wish for documentation — type it in plain language.' },
  { n: '02', title: 'Orchestrator understands intent', body: 'A lightweight router reads the request in real time and identifies the right specialist for the job.' },
  { n: '03', title: 'The right specialist gets to work', body: 'Streams back token by token, with full context from the conversation and project history.' }
];

const STUDY_FEATURES = [
  { icon: Upload, title: 'Upload real material', desc: 'PDFs, docs, or notes — chunked and embedded into your own private knowledge base.' },
  { icon: MessageSquareText, title: 'Ask it anything', desc: 'Answers are generated only from what you uploaded — no outside guessing, no hallucinated facts.' },
  { icon: GraduationCap, title: 'Get a study plan', desc: 'A source-grounded, week-by-week curriculum built from your actual material.' },
  { icon: ListChecks, title: 'Take a quiz', desc: 'Mixed question types generated from your content, graded instantly with real explanations.' },
  { icon: TrendingUp, title: 'Track real progress', desc: 'Per-topic scores computed only from quizzes you’ve actually taken — never a fabricated number.' }
];

const EXAM_FEATURES = [
  { icon: ClipboardCheck, title: 'Create from your study plan', desc: 'Full plan, selected topics, weak areas, or a follow-up on last time — you choose the scope.' },
  { icon: Timer, title: 'Server-authoritative timer', desc: 'The clock lives on the server. Refreshing, closing the tab, or losing connection never resets it.' },
  { icon: AlertTriangle, title: 'Weak-area detection', desc: 'Topic and concept-level breakdown of exactly where you lost points, not just a final score.' },
  { icon: TrendingUp, title: 'Follow-up assessments', desc: 'A recommendation lands on your study plan, and a targeted re-exam measures real improvement.' }
];

const RESULTS_FEATURES = [
  { icon: LineChart, title: 'Performance over time', desc: 'A real trend line across every quiz and exam you have taken — filterable by range.' },
  { icon: BarChart3, title: 'Topic & concept mastery', desc: 'Quiz and exam performance blended into one honest per-topic number, down to the concept.' },
  { icon: CheckCircle2, title: 'Strengths & weak spots', desc: 'Consistently strong and weak topics, each explained by exactly how many quizzes and exams back it.' },
  { icon: Sparkles, title: 'AI performance insights', desc: 'One agent reads your actual statistics and writes up what they mean — it never invents the numbers itself.' }
];

export default function LandingPage() {
  const [showContact, setShowContact] = useState(false);
  const [showAudit, setShowAudit] = useState(false);

  return (
    <div className="min-h-screen mesh-bg">
      <LandingHeader onOpenContact={() => setShowContact(true)} onOpenAudit={() => setShowAudit(true)} />

      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
      {showAudit && <FreeAuditModal onClose={() => setShowAudit(false)} />}

      {/* ============ HERO ============ */}
      <main className="px-6 md:px-10 max-w-[1200px] mx-auto">
        <section className="pt-14 md:pt-20 pb-24 grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-line2 bg-card px-4 py-1.5 text-xs font-medium tracking-wide text-text2-muted mb-7">
              <Sparkles className="w-3.5 h-3.5 text-brand" />
              ONE WORKSPACE · SIX SPECIALISTS
            </div>

            <h1 className="font-heading text-5xl md:text-6xl font-extrabold text-text2 leading-[1.05] tracking-tight mb-6">
              Build with an <span className="brand-gradient-text">AI team</span>, not a single assistant.
            </h1>

            <p className="text-lg text-text2-muted leading-relaxed max-w-lg mb-9">
              DevMind orchestrates six specialist agents — Planner, Coder, Debugger, Documenter, Reviewer, and Tester — from one intelligent developer workspace. Speak once — the right specialist answers.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-3">
              <Link
                to="/signup"
                className="btn-brand group flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-semibold w-full sm:w-auto justify-center"
              >
                Start building free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-line2 bg-card text-text2 font-semibold hover:border-line2-strong hover:bg-card-hover transition-colors w-full sm:w-auto justify-center"
              >
                Explore the workspace
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 bg-brand/10 blur-3xl rounded-full pointer-events-none"></div>
            <OrchestratorPreview className="relative shadow-2xl shadow-black/50" />
          </div>
        </section>

        {/* ============ AGENT SECTION ============ */}
        <section id="agents" className="pb-24 scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text2 mb-3">
              Seven roles.<br className="md:hidden" /> One intelligent workspace.
            </h2>
            <p className="text-text2-muted max-w-md mx-auto">The orchestrator routes; six specialists execute.</p>
          </div>

          {/* Orchestrator — dominant */}
          <div className="rounded-2xl border border-specialist-orchestrator/25 bg-specialist-orchestrator/[0.05] p-7 md:p-8 mb-4 flex flex-col md:flex-row md:items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-specialist-orchestrator/15 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-6 h-6 text-specialist-orchestrator" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2 mb-1">
                <h3 className="font-heading text-xl font-bold text-text2">Orchestrator</h3>
                <span className="text-xs text-text2-faint">/ The Router</span>
              </div>
              <p className="text-text2-muted text-sm leading-relaxed max-w-2xl">
                Routes every request to the right specialist. No mode-switching, no manual hand-off — just describe what you need.
              </p>
            </div>
          </div>

          {/* 6 specialists */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SPECIALISTS.map((s) => (
              <article
                key={s.name}
                className="group bg-card border border-line2 rounded-2xl p-7 hover:border-line2-strong hover:bg-card-hover transition-all duration-300"
              >
                <div className={`w-11 h-11 rounded-xl ${s.bgClass} flex items-center justify-center mb-5`}>
                  <s.icon className={`w-5 h-5 ${s.iconClass}`} strokeWidth={2} />
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <h3 className="font-heading text-xl font-bold text-text2">{s.name}</h3>
                  <span className="text-xs text-text2-faint">/ {s.role}</span>
                </div>
                <p className="text-text2-muted text-sm leading-relaxed">{s.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ============ HOW IT WORKS ============ */}
        <section id="how-it-works" className="pb-24 scroll-mt-24">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text2 mb-3">How it works</h2>
            <p className="text-text2-muted max-w-md mx-auto">No agent-juggling, no mode-switching. You type, DevMind dispatches.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            {STEPS.map((step, i) => (
              <div key={step.n} className="relative bg-card border border-line2 rounded-2xl p-7">
                <div className="font-heading text-3xl font-extrabold text-brand mb-4">{step.n}</div>
                <h4 className="font-heading text-lg font-bold text-text2 mb-2">{step.title}</h4>
                <p className="text-text2-muted text-sm leading-relaxed">{step.body}</p>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-6 w-4 h-4 text-text2-faint" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ============ STUDY PLANS ============ */}
        <section id="study-plans" className="pb-24 scroll-mt-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-line2 bg-card px-4 py-1.5 text-xs font-medium tracking-wide text-text2-muted mb-5">
              <GraduationCap className="w-3.5 h-3.5 text-specialist-docs" />
              A SEPARATE WORKSPACE, BUILT FOR LEARNING
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text2 mb-3">Study plans, grounded in what you actually uploaded</h2>
            <p className="text-text2-muted max-w-lg mx-auto">Not a general chatbot with your files attached — a real retrieval pipeline that refuses to answer beyond your own material.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {STUDY_FEATURES.map((f) => (
              <div key={f.title} className="bg-card border border-line2 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-specialist-docs/15 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-specialist-docs" />
                </div>
                <h3 className="font-heading text-base font-bold text-text2 mb-1.5">{f.title}</h3>
                <p className="text-text2-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ EXAMINATIONS ============ */}
        <section id="examinations" className="pb-24 scroll-mt-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-line2 bg-card px-4 py-1.5 text-xs font-medium tracking-wide text-text2-muted mb-5">
              <ClipboardCheck className="w-3.5 h-3.5 text-specialist-reviewer" />
              TEST PREPARATION, UNDER REALISTIC CONDITIONS
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text2 mb-3">Examinations that measure what you actually know</h2>
            <p className="text-text2-muted max-w-lg mx-auto">Timed and source-grounded — generated from your study plan's real material, not invented on the spot.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {EXAM_FEATURES.map((f) => (
              <div key={f.title} className="bg-card border border-line2 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-specialist-reviewer/15 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-specialist-reviewer" />
                </div>
                <h3 className="font-heading text-base font-bold text-text2 mb-1.5">{f.title}</h3>
                <p className="text-text2-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ RESULTS ============ */}
        <section id="results" className="pb-24 scroll-mt-24">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-line2 bg-card px-4 py-1.5 text-xs font-medium tracking-wide text-text2-muted mb-5">
              <LineChart className="w-3.5 h-3.5 text-specialist-tester" />
              UNDERSTAND YOUR ENTIRE LEARNING JOURNEY
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text2 mb-3">Results, built from what you've actually done</h2>
            <p className="text-text2-muted max-w-lg mx-auto">Every number on this dashboard traces back to a real quiz or exam attempt — nothing is estimated to fill a chart.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {RESULTS_FEATURES.map((f) => (
              <div key={f.title} className="bg-card border border-line2 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-xl bg-specialist-tester/15 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-specialist-tester" />
                </div>
                <h3 className="font-heading text-base font-bold text-text2 mb-1.5">{f.title}</h3>
                <p className="text-text2-muted text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ============ ABOUT ============ */}
        <section id="about" className="pb-24 scroll-mt-24">
          <div className="bg-card border border-line2 rounded-2xl p-8 md:p-10 max-w-3xl mx-auto text-center">
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-text2 mb-4">About DevMind</h2>
            <p className="text-text2-muted leading-relaxed mb-3">
              DevMind is an AI engineering workspace built around one idea: route each request to a specialist that actually knows the job, instead of asking one generalist model to be everything at once.
            </p>
            <p className="text-text2-muted leading-relaxed">
              It's four genuinely separate systems working together: Projects for shipping code with real context, checkpoints, and review; Study Plans for learning from material you actually uploaded; Examinations for testing that knowledge under realistic conditions; and Results for understanding the whole picture — with nothing invented along the way.
            </p>
          </div>
        </section>

        {/* ============ CTA BAND ============ */}
        <section className="pb-20">
          <div className="btn-brand rounded-3xl px-8 py-14 text-center relative overflow-hidden">
            <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-white mb-3 relative z-10">Ready to build?</h2>
            <p className="text-white/80 max-w-md mx-auto mb-8 relative z-10">Free forever. No card required. Your workspace is ready in under a minute.</p>
            <Link
              to="/signup"
              className="relative z-10 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-brand-strong font-semibold hover:bg-white/90 transition-colors"
            >
              Create your account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* ============ FOOTER ============ */}
      <footer className="border-t border-line2">
        <div className="px-6 md:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-[1200px] mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg btn-brand flex items-center justify-center text-white font-heading font-extrabold text-xs">
              dm
            </div>
            <span className="text-sm text-text2-faint">© 2026 DevMind. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-5">
            <button onClick={() => setShowContact(true)} className="text-sm text-text2-faint hover:text-text2 transition-colors flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              Contact us
            </button>
            <span className="text-sm text-text2-faint">Built with React, Express &amp; MongoDB.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
