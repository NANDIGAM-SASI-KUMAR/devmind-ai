// Standalone evaluation script — connects to the real Mongo + Chroma the app uses, ingests
// a real test document through the actual ingestion path, runs the labeled dataset through
// both BASELINE and ADVANCED pipeline modes, prints a real measured comparison, then
// deletes every bit of test data it created. Run with: node src/rag/evaluation/runEvaluation.mjs
import 'dotenv/config';
import mongoose from 'mongoose';
import RagParentChunk from '../../models/RagParentChunk.js';
import { chunkStructured } from '../chunking.js';
import { addStructuredChunks, deleteStudyPlanCollection } from '../../utils/chroma.js';
import { askStudyAgent } from '../../agents/studyAgent.js';
import { runEvaluation } from './runner.js';
import { formatComparisonReport } from './report.js';

const EVAL_COLLECTION_ID = 'evalharness000000000001'; // synthetic id — studyCollectionName() just needs a string
const collectionName = `study_${EVAL_COLLECTION_ID}`;

const TEST_DOCUMENT = `# Introduction to Databases

A database is an organized collection of structured information stored electronically in a computer system. Databases are managed by a database management system (DBMS).

## Relational Databases

Relational databases store data in tables with rows and columns. Each table has a schema defining its columns and data types. Tables can be linked using foreign keys. PostgreSQL and MySQL are popular relational database systems.

## Normalization

Normalization is the process of organizing data to reduce redundancy. The most common normal forms are First Normal Form (1NF), Second Normal Form (2NF), and Third Normal Form (3NF). Third Normal Form requires that all columns depend only on the primary key.

# Caching

Caching is a technique used to store frequently accessed data in a fast-access layer, reducing the need to repeatedly fetch it from a slower source such as a database or disk.

## Redis

Redis is an in-memory data structure store often used as a cache, message broker, and database. Redis supports data structures such as strings, hashes, lists, sets, and sorted sets. Redis achieves low latency because data lives in RAM rather than on disk.

## Cache Eviction Policies

When a cache reaches its memory limit, it must evict some entries to make room for new ones. Common eviction policies include Least Recently Used (LRU), which evicts the entry that hasn't been accessed for the longest time, and Time-To-Live (TTL) expiration, which evicts entries after a fixed duration regardless of access patterns.`;

const ingest = async () => {
  const { parents, children } = chunkStructured(TEST_DOCUMENT);
  const documentId = 'eval-doc-1';
  await RagParentChunk.insertMany(
    parents.map((p) => ({
      collectionName,
      documentId,
      parentId: `${documentId}_${p.parentId}`,
      originalName: 'eval-material.md',
      heading: p.heading,
      section: p.section,
      text: p.text
    }))
  );
  await addStructuredChunks(
    EVAL_COLLECTION_ID,
    documentId,
    'eval-material.md',
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

  console.log('\nRunning BASELINE pipeline over the dataset...');
  const baseline = await runEvaluation({ collectionName, generate, mode: 'baseline' });

  console.log('Running ADVANCED pipeline over the dataset...');
  const advanced = await runEvaluation({ collectionName, generate, mode: 'advanced' });

  console.log('\n' + formatComparisonReport(baseline, advanced) + '\n');

  console.log('Per-question detail (advanced mode):');
  for (const q of advanced.perQuestion) {
    console.log(`  ${q.id} [${q.category}] recall@5=${q.recallAt5} mrr=${q.mrr} refusal=${q.refusalCorrectness} citAcc=${q.citationAccuracy} latency=${q.latencyMs}ms`);
  }

  await cleanup();
  await mongoose.disconnect();
};

main().catch(async (err) => {
  console.error('Evaluation run failed:', err);
  await cleanup().catch(() => {});
  process.exit(1);
});
