import { hybridRetrieve } from './hybridRetriever.js';
import { buildContext } from './contextBuilder.js';
import { validateAnswer } from './validator.js';
import { RAG_CONFIG } from './config.js';

// The full pipeline: Query -> Hybrid Retrieval -> Context Builder -> Generate -> Validate
// -> (retry once if not grounded) -> Answer or safe fallback. `generate(contextString)` is
// supplied by the caller so this stays reusable across different prompts/agents rather than
// hard-coding one — Study Plan Q&A is the first integration, others can reuse this as-is.
export const runRagPipeline = async ({ collectionName, query, generate, overrides = {} }) => {
  const cfg = { ...RAG_CONFIG, ...overrides };
  const startedAt = Date.now();
  // Structured, non-sensitive tracing: scores/timings/outcome only, never chunk contents.
  const log = { collectionName, queryLength: query.length };

  const { candidates, timings, topScore } = await hybridRetrieve(collectionName, query, overrides);
  Object.assign(log, timings, { topScore: Math.round(topScore * 100) / 100, candidateCount: candidates.length });

  if (candidates.length === 0 || topScore < cfg.minRetrievalScore) {
    log.outcome = 'insufficient_evidence';
    log.totalMs = Date.now() - startedAt;
    console.log('[rag]', JSON.stringify(log));
    return {
      answer: "I couldn't find enough relevant information in the uploaded material to answer that confidently.",
      citations: [],
      confidence: 0,
      grounded: false,
      insufficientEvidence: true
    };
  }

  const { contextString, citations } = await buildContext(collectionName, candidates, query, { maxChars: cfg.maxContextChars });

  let answer = await generate(contextString);
  let validation = await validateAnswer({ answer, evidence: contextString });

  const MAX_RETRIES = 1;
  let retries = 0;
  while ((!validation.grounded || validation.confidence < cfg.minGroundednessScore) && retries < MAX_RETRIES) {
    answer = await generate(contextString);
    validation = await validateAnswer({ answer, evidence: contextString });
    retries += 1;
  }

  const finalGrounded = validation.grounded && validation.confidence >= cfg.minGroundednessScore;
  log.outcome = finalGrounded ? 'answered' : 'fallback';
  log.confidence = validation.confidence;
  log.retries = retries;
  log.totalMs = Date.now() - startedAt;
  console.log('[rag]', JSON.stringify(log));

  if (!finalGrounded) {
    return {
      answer: "I found related material, but couldn't produce a fully grounded answer to that specific question. Try rephrasing, or check the source material directly.",
      citations,
      confidence: validation.confidence,
      grounded: false,
      insufficientEvidence: false
    };
  }

  return { answer, citations, confidence: validation.confidence, grounded: true, insufficientEvidence: false };
};
