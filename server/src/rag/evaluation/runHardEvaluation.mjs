// Same harness as runEvaluation.mjs, run against the harder disambiguation-focused dataset
// (see hardDataset.js) so Recall@K/MRR/nDCG have room to actually differentiate baseline
// from advanced, instead of both ceiling at 100% on a small, topically-distinct document.
import 'dotenv/config';
import mongoose from 'mongoose';
import RagParentChunk from '../../models/RagParentChunk.js';
import { chunkStructured } from '../chunking.js';
import { addStructuredChunks, deleteStudyPlanCollection } from '../../utils/chroma.js';
import { askStudyAgent } from '../../agents/studyAgent.js';
import { runEvaluation } from './runner.js';
import { formatComparisonReport } from './report.js';
import { HARD_TEST_DOCUMENT, HARD_EVAL_DATASET } from './hardDataset.js';

const EVAL_COLLECTION_ID = 'evalhardharness00000001';
const collectionName = `study_${EVAL_COLLECTION_ID}`;

const ingest = async () => {
  const { parents, children } = chunkStructured(HARD_TEST_DOCUMENT);
  const documentId = 'eval-hard-doc-1';
  await RagParentChunk.insertMany(
    parents.map((p) => ({
      collectionName,
      documentId,
      parentId: `${documentId}_${p.parentId}`,
      originalName: 'distributed-systems.md',
      heading: p.heading,
      section: p.section,
      text: p.text
    }))
  );
  await addStructuredChunks(
    EVAL_COLLECTION_ID,
    documentId,
    'distributed-systems.md',
    children.map((c) => ({ ...c, parentId: `${documentId}_${c.parentId}` }))
  );
  console.log(`Ingested ${parents.length} parent sections / ${children.length} child chunks into ${collectionName}`);
};

const cleanup = async () => {
  await RagParentChunk.deleteMany({ collectionName });
  await deleteStudyPlanCollection(EVAL_COLLECTION_ID);
  console.log('Evaluation test data cleaned up.');
};

const main = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await ingest();

  const generate = (question, context) => askStudyAgent({ question, context, understandingLevel: 'intermediate' });

  console.log('\nRunning BASELINE pipeline over the HARD dataset...');
  const baseline = await runEvaluation({ collectionName, generate, mode: 'baseline', dataset: HARD_EVAL_DATASET });

  console.log('Running ADVANCED pipeline over the HARD dataset...');
  const advanced = await runEvaluation({ collectionName, generate, mode: 'advanced', dataset: HARD_EVAL_DATASET });

  console.log('\n' + formatComparisonReport(baseline, advanced) + '\n');

  console.log('Per-question detail — BASELINE vs ADVANCED recall@5 (where retrieval actually differed):');
  for (let i = 0; i < advanced.perQuestion.length; i++) {
    const a = advanced.perQuestion[i];
    const b = baseline.perQuestion[i];
    const differs = a.recallAt5 !== b.recallAt5 || a.mrr !== b.mrr;
    console.log(`  ${a.id} [${a.category}] baseline_recall@5=${b.recallAt5} baseline_mrr=${b.mrr?.toFixed(2)} | advanced_recall@5=${a.recallAt5} advanced_mrr=${a.mrr?.toFixed(2)} ${differs ? '  <-- DIFFERS' : ''}`);
  }

  await cleanup();
  await mongoose.disconnect();
};

main().catch(async (err) => {
  console.error('Evaluation run failed:', err);
  await cleanup().catch(() => {});
  process.exit(1);
});
