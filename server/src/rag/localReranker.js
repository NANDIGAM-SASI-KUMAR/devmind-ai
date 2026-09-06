import { AutoTokenizer, AutoModelForSequenceClassification } from '@huggingface/transformers';

// A real local cross-encoder reranker (MS MARCO MiniLM), run entirely in-process via ONNX —
// no external API, no GPU required. First load downloads and caches the model (~90MB, one
// time, ~20s); every load after that reads from local cache in well under a second, and
// scoring itself is single-digit milliseconds per candidate. This uses the low-level
// tokenizer+model API rather than the high-level `pipeline()` helper deliberately: this
// model has a single regression output neuron, and pipeline()'s classification softmax
// collapses any single-class output to a meaningless constant 1.0 — the raw logit is the
// actual usable relevance score.
const MODEL_NAME = 'Xenova/ms-marco-MiniLM-L-6-v2';

let modelPromise = null;
const loadModel = () => {
  if (!modelPromise) {
    modelPromise = (async () => {
      const tokenizer = await AutoTokenizer.from_pretrained(MODEL_NAME);
      const model = await AutoModelForSequenceClassification.from_pretrained(MODEL_NAME, { dtype: 'fp32' });
      return { tokenizer, model };
    })();
  }
  return modelPromise;
};

// Fire-and-forget warm-up — call once at server startup so the ~20s first-load cost isn't
// paid by whichever user happens to send the first real request.
export const warmUpLocalReranker = () => {
  loadModel()
    .then(() => console.log('[rag] Local cross-encoder reranker warmed up'))
    .catch((err) => console.error('[rag] Local reranker warm-up failed (will retry lazily on first use):', err.message));
};

export const localRerank = async (query, candidates, { topK = 6 } = {}) => {
  if (candidates.length === 0) return [];
  const { tokenizer, model } = await loadModel();

  const scored = await Promise.all(
    candidates.map(async (c) => {
      const inputs = await tokenizer(query, { text_pair: c.text.slice(0, 2000), padding: true, truncation: true });
      const { logits } = await model(inputs);
      return { ...c, rerankScore: logits.data[0] };
    })
  );

  return scored.sort((a, b) => b.rerankScore - a.rerankScore).slice(0, topK);
};
