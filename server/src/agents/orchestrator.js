import { callLLM } from '../utils/llm.js';
import { plannerAgent } from './plannerAgent.js';
import { coderAgent } from './coderAgent.js';
import { debuggerAgent } from './debuggerAgent.js';
import { docsAgent } from './docsAgent.js';
import { reviewerAgent } from './reviewerAgent.js';
import { testerAgent } from './testerAgent.js';

export const AGENT_NAMES = ['planner', 'coder', 'debugger', 'docs', 'reviewer', 'tester'];

/**
 * Decide which agent should handle the user's message.
 * Uses a lightweight LLM call to classify intent.
 */
const ROUTER_PROMPT = `You are a routing classifier. Given a user message, decide which agent should handle it.

Agents:
- planner: planning, breaking down ideas, project roadmaps, "how should I build X", architecture decisions
- coder: writing code, generating components, "create a function/API/component"
- debugger: errors, stack traces, bug fixes, "why doesn't this work", troubleshooting
- docs: README files, API docs, code comments, documentation writing
- reviewer: code review requests, "check this for issues", security/quality/performance review, spotting bad patterns
- tester: writing tests, "generate test cases", "what edge cases am I missing", analyzing test failures

Respond with EXACTLY ONE WORD from this list: planner, coder, debugger, docs, reviewer, tester

User message:`;

export const routeMessage = async (userMessage) => {
  try {
    const choice = await callLLM({
      system: ROUTER_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
      maxTokens: 20
    });
    const cleaned = choice.toLowerCase().trim().replace(/[^a-z]/g, '');
    if (AGENT_NAMES.includes(cleaned)) return cleaned;
    return 'planner'; // fallback
  } catch (err) {
    console.error('Routing error:', err.message);
    return 'planner';
  }
};

/**
 * Run the chosen agent with streaming.
 */
export const runAgent = async ({ agentName, userMessage, history, projectContext, onChunk }) => {
  const agentMap = {
    planner: plannerAgent,
    coder: coderAgent,
    debugger: debuggerAgent,
    docs: docsAgent,
    reviewer: reviewerAgent,
    tester: testerAgent
  };
  const agent = agentMap[agentName] || plannerAgent;
  return agent({ userMessage, history, projectContext, onChunk });
};

export const AGENT_META = {
  planner: { label: 'Planner', color: '#a78bfa', icon: 'brain' },
  coder: { label: 'Coder', color: '#34d399', icon: 'code' },
  debugger: { label: 'Debugger', color: '#fb923c', icon: 'bug' },
  docs: { label: 'Docs', color: '#60a5fa', icon: 'file-text' },
  reviewer: { label: 'Reviewer', color: '#f472b6', icon: 'shield-check' },
  tester: { label: 'Tester', color: '#22d3ee', icon: 'flask-conical' }
};
