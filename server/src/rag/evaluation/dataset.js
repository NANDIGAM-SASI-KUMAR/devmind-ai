// A real labeled evaluation set, built against the actual test document used throughout
// this upgrade (databases/caching/Redis Markdown material — see the material used in
// server/src/rag/evaluation/runEvaluation.mjs). Ground truth is by SECTION HEADING rather
// than exact chunk ID, since chunk IDs aren't stable across re-ingestion but the document's
// actual sections are — a chunk is "relevant" for a question if it belongs to one of the
// question's expectedSections. This is honestly constructed (the document was authored for
// this test), not sourced from a fabricated or hypothetical dataset.
export const EVAL_DATASET = [
  {
    id: 'q1_simple',
    question: 'What is Redis used for?',
    category: 'simple_factual',
    expectedSections: ['Redis'],
    expectAnswerable: true,
    expectedKeywords: ['redis', 'cache', 'memory']
  },
  {
    id: 'q2_exact_keyword',
    question: 'What does TTL expiration mean for cache eviction?',
    category: 'exact_keyword',
    expectedSections: ['Cache Eviction Policies'],
    expectAnswerable: true,
    expectedKeywords: ['ttl', 'expir', 'duration']
  },
  {
    id: 'q3_semantic',
    question: 'How does a cache decide what to remove when it runs out of room?',
    category: 'semantic_paraphrase', // no exact keyword overlap with the source text — tests dense retrieval specifically
    expectedSections: ['Cache Eviction Policies'],
    expectAnswerable: true,
    expectedKeywords: ['lru', 'ttl', 'evict']
  },
  {
    id: 'q4_multi_section',
    question: 'How do relational databases differ from a caching system like Redis?',
    category: 'multi_hop',
    expectedSections: ['Relational Databases', 'Redis'],
    expectAnswerable: true,
    expectedKeywords: ['table', 'redis', 'memory']
  },
  {
    id: 'q5_normalization',
    question: 'What does Third Normal Form require?',
    category: 'simple_factual',
    expectedSections: ['Normalization'],
    expectAnswerable: true,
    expectedKeywords: ['primary key', 'column']
  },
  {
    id: 'q6_unrelated',
    question: 'How does quantum entanglement enable faster computation?',
    category: 'not_covered',
    expectedSections: [],
    expectAnswerable: false,
    expectedKeywords: []
  },
  {
    id: 'q7_similar_but_uncovered',
    question: 'What consistency guarantees does MongoDB provide?',
    category: 'similar_but_incorrect_evidence', // topically "database", but MongoDB itself is never mentioned
    expectedSections: [],
    expectAnswerable: false,
    expectedKeywords: []
  },
  {
    id: 'q8_ambiguous',
    question: 'How does it work?',
    category: 'ambiguous',
    expectedSections: [], // too ambiguous to have one right answer — used for QueryAnalyzer behavior, not retrieval metrics
    expectAnswerable: false,
    expectedKeywords: []
  }
];
