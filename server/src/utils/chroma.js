import { ChromaClient, CloudClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

let client = null;
const getClient = () => {
  if (!client) {
    // Chroma Cloud in production (set CHROMA_API_KEY); falls back to a local Chroma
    // server for dev, unchanged from before (`npm run chroma`, localhost:8000). This was a
    // real production gap until now — the local-only connection meant every Study Plan/
    // Project-file upload silently failed to index on any deployed environment.
    client = process.env.CHROMA_API_KEY
      ? new CloudClient({
          apiKey: process.env.CHROMA_API_KEY,
          tenant: process.env.CHROMA_TENANT,
          database: process.env.CHROMA_DATABASE
        })
      : new ChromaClient({
          host: process.env.CHROMA_HOST || 'localhost',
          port: Number(process.env.CHROMA_PORT) || 8000,
          ssl: false
        });
  }
  return client;
};

// Explicitly forcing the SAME embedding function on every collection, regardless of
// backend, is deliberate — not cosmetic. Measured directly while adding Chroma Cloud
// support: without this, Chroma Cloud silently used a different default embedding model
// than the local server, producing a completely different similarity-score distribution
// (a genuinely correct match scored ~0.27 instead of the ~0.5+ this app's retrieval
// confidence formula is calibrated against). Computing embeddings client-side with the
// same model everywhere keeps that calibration valid no matter which backend is active.
let embeddingFunction = null;
const getEmbeddingFunction = () => {
  if (!embeddingFunction) embeddingFunction = new DefaultEmbeddingFunction();
  return embeddingFunction;
};

// The embedding model is downloaded lazily to local disk on first use (same mechanism as
// the local reranker). Root-caused a real production failure this way: multiple concurrent
// first-use requests (exam creation fires one Chroma query per topic, in parallel) each
// triggered their own download of the same model file into the same cache path, racing
// each other and corrupting it ("Protobuf parsing failed" on every query afterward, since
// the corrupted file is now permanently cached and never re-downloaded). This forces the
// download to happen exactly once, synchronously, before the server accepts any traffic —
// call and AWAIT this at startup, same pattern as warmUpLocalReranker.
let warmupPromise = null;
export const warmUpEmbeddingFunction = () => {
  if (!warmupPromise) warmupPromise = getEmbeddingFunction().generate(['warm up']);
  return warmupPromise;
};

const getOrCreateCollection = (collectionName) =>
  getClient().getOrCreateCollection({ name: collectionName, embeddingFunction: getEmbeddingFunction() });

// ---------- Generic collection helpers (used by both Study Plans and project code search) ----------

const addChunksTo = async (collectionName, docId, originalName, chunks, extraMetaKey) => {
  if (chunks.length === 0) return;
  const collection = await getOrCreateCollection(collectionName);
  await collection.add({
    ids: chunks.map((_, i) => `${docId}_${i}`),
    documents: chunks,
    metadatas: chunks.map((_, i) => ({ [extraMetaKey]: String(docId), originalName, chunkIndex: i }))
  });
};

// Same as addChunksTo, but for structured (parent-linked) children — each carries its
// parentId/heading/section so retrieval can resolve full parent context afterward.
const addStructuredChunksTo = async (collectionName, docId, originalName, children, extraMetaKey) => {
  if (children.length === 0) return;
  const collection = await getOrCreateCollection(collectionName);
  await collection.add({
    ids: children.map((_, i) => `${docId}_${i}`),
    documents: children.map((c) => c.text),
    metadatas: children.map((c, i) => ({
      [extraMetaKey]: String(docId),
      originalName,
      chunkIndex: i,
      parentId: c.parentId,
      heading: c.heading || '',
      section: c.section || ''
    }))
  });
};

// Fetches every chunk in a collection (documents + metadata, no embeddings needed) — used
// to build a fresh BM25 index per query. Fine at this app's per-collection scale (tens to
// a few hundred chunks); a larger corpus would need a persistent inverted index instead.
const getAllDocs = async (collectionName) => {
  try {
    const collection = await getOrCreateCollection(collectionName);
    const count = await collection.count();
    if (count === 0) return [];
    const result = await collection.get({ limit: count, include: ['documents', 'metadatas'] });
    return result.rows().map((r) => ({ id: r.id, text: r.document, metadata: r.metadata }));
  } catch (err) {
    console.error('Chroma getAllDocs failed:', err.message);
    return [];
  }
};

// Dense query that also returns embeddings and similarity (1 - distance), for MMR
// diversification, which needs the actual vectors to compute inter-candidate similarity.
const queryWithEmbeddings = async (collectionName, queryText, nResults) => {
  try {
    const collection = await getOrCreateCollection(collectionName);
    const count = await collection.count();
    if (count === 0) return [];
    const results = await collection.query({
      queryTexts: [queryText],
      nResults: Math.min(nResults, count),
      include: ['documents', 'metadatas', 'distances', 'embeddings']
    });
    return (results.documents?.[0] || []).map((doc, i) => ({
      id: results.ids?.[0]?.[i],
      text: doc,
      metadata: results.metadatas?.[0]?.[i],
      distance: results.distances?.[0]?.[i],
      embedding: results.embeddings?.[0]?.[i]
    }));
  } catch (err) {
    console.error('Chroma queryWithEmbeddings failed:', err.message);
    return [];
  }
};

const deleteDocChunksFrom = async (collectionName, docId, extraMetaKey) => {
  try {
    const collection = await getOrCreateCollection(collectionName);
    await collection.delete({ where: { [extraMetaKey]: String(docId) } });
  } catch (err) {
    console.error('Failed to delete chunks:', err.message);
  }
};

const deleteCollectionByName = async (collectionName) => {
  try {
    await getClient().deleteCollection({ name: collectionName });
  } catch (err) {
    // Collection may not exist (e.g. nothing was ever uploaded) — safe to ignore.
  }
};

const queryCollection = async (collectionName, queryText, nResults) => {
  try {
    const collection = await getOrCreateCollection(collectionName);
    const count = await collection.count();
    if (count === 0) return [];

    const results = await collection.query({
      queryTexts: [queryText],
      nResults: Math.min(nResults, count)
    });
    return (results.documents?.[0] || []).map((doc, i) => ({
      text: doc,
      metadata: results.metadatas?.[0]?.[i]
    }));
  } catch (err) {
    console.error('Chroma query failed:', err.message);
    return [];
  }
};

// ---------- Study Plan materials (existing) ----------

export const studyCollectionName = (studyPlanId) => `study_${studyPlanId}`;

export const addChunks = (studyPlanId, materialId, originalName, chunks) =>
  addChunksTo(studyCollectionName(studyPlanId), materialId, originalName, chunks, 'materialId');

export const addStructuredChunks = (studyPlanId, materialId, originalName, children) =>
  addStructuredChunksTo(studyCollectionName(studyPlanId), materialId, originalName, children, 'materialId');

export const deleteMaterialChunks = (studyPlanId, materialId) =>
  deleteDocChunksFrom(studyCollectionName(studyPlanId), materialId, 'materialId');

export const deleteStudyPlanCollection = (studyPlanId) => deleteCollectionByName(studyCollectionName(studyPlanId));

export const queryChunks = (studyPlanId, queryText, nResults = 8) =>
  queryCollection(studyCollectionName(studyPlanId), queryText, nResults);

// ---------- Project code files (semantic codebase search) ----------

export const codeCollectionName = (projectId) => `code_${projectId}`;

export const addCodeChunks = (projectId, fileId, originalName, chunks) =>
  addChunksTo(codeCollectionName(projectId), fileId, originalName, chunks, 'fileId');

export const addStructuredCodeChunks = (projectId, fileId, originalName, children) =>
  addStructuredChunksTo(codeCollectionName(projectId), fileId, originalName, children, 'fileId');

export const deleteCodeFileChunks = (projectId, fileId) =>
  deleteDocChunksFrom(codeCollectionName(projectId), fileId, 'fileId');

// ---------- Generic, collection-name-based access for the advanced RAG pipeline ----------
// (used by rag/hybridRetriever.js, which works the same way regardless of whether the
// collection belongs to a Study Plan or a Project's code search)

export const getAllChunksIn = (collectionName) => getAllDocs(collectionName);
export const queryDenseWithEmbeddings = (collectionName, queryText, nResults) =>
  queryWithEmbeddings(collectionName, queryText, nResults);

export const deleteProjectCodeCollection = (projectId) => deleteCollectionByName(codeCollectionName(projectId));

export const queryCodeChunks = (projectId, queryText, nResults = 8) =>
  queryCollection(codeCollectionName(projectId), queryText, nResults);
