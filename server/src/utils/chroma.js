import { ChromaClient } from 'chromadb';

let client = null;
const getClient = () => {
  if (!client) {
    client = new ChromaClient({ host: 'localhost', port: 8000, ssl: false });
  }
  return client;
};

// ---------- Generic collection helpers (used by both Study Plans and project code search) ----------

const addChunksTo = async (collectionName, docId, originalName, chunks, extraMetaKey) => {
  if (chunks.length === 0) return;
  const collection = await getClient().getOrCreateCollection({ name: collectionName });
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
  const collection = await getClient().getOrCreateCollection({ name: collectionName });
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
    const collection = await getClient().getOrCreateCollection({ name: collectionName });
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
    const collection = await getClient().getOrCreateCollection({ name: collectionName });
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
    const collection = await getClient().getOrCreateCollection({ name: collectionName });
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
    const collection = await getClient().getOrCreateCollection({ name: collectionName });
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
