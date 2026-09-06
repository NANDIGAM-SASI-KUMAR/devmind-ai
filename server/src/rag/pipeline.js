import crypto from 'crypto';
import { hybridRetrieve } from './hybridRetriever.js';
import { buildContext } from './contextBuilder.js';
import { validateAnswer, filterSupportedCitations } from './validator.js';
import { computeFinalConfidence } from './confidence.js';
import { RAG_CONFIG } from './config.js';

const round = (n) => Math.round(n * 1000) / 1000;

// Debug mode never dumps full document text to the client — just enough of each
// candidate (200 chars) to see WHY it ranked where it did, plus every score it carries.
const toDebugCandidates = (candidates) =>
  candidates.map((c) => ({
    id: c.id,
    preview: c.text.slice(0, 200),
    section: c.metadata?.heading || c.metadata?.section || '',
    denseScore: c.denseScore ?? null,
    bm25Score: c.bm25Score ?? null,
    rrfScore: c.rrfScore ?? null,
    rerankScore: c.rerankScore ?? null,
    rerankScoreNormalized: c.rerankScoreNormalized ?? null,
    relevanceScore: round(c.relevanceScore ?? 0)
  }));

// BASELINE approximates the pre-upgrade pipeline (dense-only, no BM25/RRF/reranking/MMR/
// claim validation) — used by the evaluation harness to measure whether the ADVANCED
// pipeline actually improves things, rather than just asserting it does.
export const BASELINE_OVERRIDES = {
  bm25Enabled: false,
  rerankerEnabled: false,
  mmrEnabled: false,
  queryExpansionEnabled: false,
  fusionTopK: 6,
  rerankTopK: 6
};

// The full pipeline: Query -> Hybrid Retrieval (Phase 2: QueryAnalyzer-gated expansion,
// RerankerService) -> Context Builder -> Generate -> Claim-level Validate -> (retry once if
// not grounded) -> Answer + validated citations, or a safe fallback. `generate(context)` is
// supplied by the caller so this stays reusable across prompts/agents.
export const runRagPipeline = async ({ collectionName, query, generate, overrides = {}, mode = 'advanced', debug = false }) => {
  const cfg = mode === 'baseline' ? { ...RAG_CONFIG, ...BASELINE_OVERRIDES, ...overrides } : { ...RAG_CONFIG, ...overrides };
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  // Structured, non-sensitive tracing: scores/timings/counts/outcome only, never chunk or
  // document contents, and no query text (queryLength only).
  const log = { requestId, collectionName, mode, queryLength: query.length };

  const { candidates, timings, trace, confidence: retrievalConfidence } = await hybridRetrieve(collectionName, query, cfg);
  Object.assign(log, trace, timings, { retrievalConfidence: round(retrievalConfidence) });

  if (candidates.length === 0 || retrievalConfidence < cfg.minRetrievalScore) {
    log.outcome = 'insufficient_evidence';
    log.fallbackUsed = true;
    log.totalMs = Date.now() - startedAt;
    console.log('[rag]', JSON.stringify(log));

    const result = {
      answer: "I couldn't find enough relevant information in the uploaded material to answer that confidently.",
      citations: [],
      confidence: 0,
      grounded: false,
      insufficientEvidence: true
    };
    if (debug) result.debug = { requestId, trace: { ...trace, ...timings }, candidates: toDebugCandidates(candidates) };
    return result;
  }

  const t5 = Date.now();
  const { contextString, citations } = await buildContext(collectionName, candidates, query, { maxChars: cfg.maxContextChars });
  const contextMs = Date.now() - t5;

  const t6 = Date.now();
  let answer = await generate(contextString);
  let generationMs = Date.now() - t6;

  const t7 = Date.now();
  let validation = await validateAnswer({ answer, evidence: contextString });
  let validationMs = Date.now() - t7;

  const MAX_RETRIES = 1;
  let retries = 0;
  // A validator TIMEOUT is not a "this answer has unsupported claims" verdict — the
  // answer was probably fine, the validator API was just slow. Regenerating doesn't fix a
  // slow external call, it just spends another full generation+validation round-trip
  // (measured: this was a real, avoidable contributor to worst-case latency) for likely
  // the same outcome. Skip the retry in that specific case and go straight to the
  // (correctly degraded) confidence-based decision below.
  while (!validation.timedOut && (!validation.grounded || validation.confidence < cfg.minGroundednessScore) && retries < MAX_RETRIES) {
    const tg = Date.now();
    answer = await generate(contextString);
    generationMs += Date.now() - tg;

    const tv = Date.now();
    validation = await validateAnswer({ answer, evidence: contextString });
    validationMs += Date.now() - tv;
    retries += 1;
  }

  const filteredCitations = filterSupportedCitations(citations, validation.supportingSources);
  const citationSupportRatio = citations.length === 0 ? 1 : filteredCitations.length / citations.length;
  const finalConfidence = computeFinalConfidence(retrievalConfidence, {
    groundednessConfidence: validation.confidence,
    citationSupportRatio
  });
  const finalGrounded = validation.grounded && finalConfidence >= cfg.minGroundednessScore;

  log.contextMs = contextMs;
  log.generationMs = generationMs;
  log.validationMs = validationMs;
  log.retries = retries;
  log.citationSupportRatio = round(citationSupportRatio);
  log.confidence = round(finalConfidence);
  log.grounded = finalGrounded;
  log.fallbackUsed = !finalGrounded;
  log.outcome = finalGrounded ? 'answered' : 'fallback';
  log.totalMs = Date.now() - startedAt;
  console.log('[rag]', JSON.stringify(log));

  const result = finalGrounded
    ? { answer, citations: filteredCitations, confidence: round(finalConfidence), grounded: true, insufficientEvidence: false }
    : {
        answer: "I found related material, but couldn't produce a fully grounded answer to that specific question. Try rephrasing, or check the source material directly.",
        citations: filteredCitations,
        confidence: round(finalConfidence),
        grounded: false,
        insufficientEvidence: false
      };

  if (debug) {
    result.debug = {
      requestId,
      trace: { ...trace, ...timings, contextMs, generationMs, validationMs },
      candidates: toDebugCandidates(candidates),
      validation
    };
  }
  return result;
};
