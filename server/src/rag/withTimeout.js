// Bounds any promise (in practice, an LLM call) to a maximum wait — a slow external API
// response should degrade to "treat as failed, use the fallback path" rather than let one
// slow call dominate total request latency unpredictably. Used by every LLM call in the
// pipeline that has a defined fallback behavior on failure (reranker, query expansion,
// answer validation).
export const withTimeout = (promise, ms) =>
  Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`timed out after ${ms}ms`)), ms))]);
