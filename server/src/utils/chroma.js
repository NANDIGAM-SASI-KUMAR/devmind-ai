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

const studyCollectionName = (studyPlanId) => `study_${studyPlanId}`;

export const addChunks = (studyPlanId, materialId, originalName, chunks) =>
  addChunksTo(studyCollectionName(studyPlanId), materialId, originalName, chunks, 'materialId');

export const deleteMaterialChunks = (studyPlanId, materialId) =>
  deleteDocChunksFrom(studyCollectionName(studyPlanId), materialId, 'materialId');

export const deleteStudyPlanCollection = (studyPlanId) => deleteCollectionByName(studyCollectionName(studyPlanId));

export const queryChunks = (studyPlanId, queryText, nResults = 8) =>
  queryCollection(studyCollectionName(studyPlanId), queryText, nResults);

// ---------- Project code files (semantic codebase search) ----------

const codeCollectionName = (projectId) => `code_${projectId}`;

export const addCodeChunks = (projectId, fileId, originalName, chunks) =>
  addChunksTo(codeCollectionName(projectId), fileId, originalName, chunks, 'fileId');

export const deleteCodeFileChunks = (projectId, fileId) =>
  deleteDocChunksFrom(codeCollectionName(projectId), fileId, 'fileId');

export const deleteProjectCodeCollection = (projectId) => deleteCollectionByName(codeCollectionName(projectId));

export const queryCodeChunks = (projectId, queryText, nResults = 8) =>
  queryCollection(codeCollectionName(projectId), queryText, nResults);
