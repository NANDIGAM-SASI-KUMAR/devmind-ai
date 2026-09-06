import mongoose from 'mongoose';

// Parent-child chunking: Chroma stores the small embedded "child" chunks (for precise
// retrieval); this collection stores the larger "parent" section they belong to (for
// generation context), so parent text is never duplicated into every vector record.
// One model shared by both Study Plan materials and Project code search — matches the
// existing generic-collection-name pattern already used in chroma.js.
const ragParentChunkSchema = new mongoose.Schema(
  {
    collectionName: { type: String, required: true }, // e.g. "study_<planId>" or "code_<projectId>"
    documentId: { type: String, required: true }, // materialId / fileId, as a string
    parentId: { type: String, required: true },
    originalName: { type: String, default: '' },
    heading: { type: String, default: '' },
    section: { type: String, default: '' },
    text: { type: String, required: true }
  },
  { timestamps: true }
);

ragParentChunkSchema.index({ collectionName: 1, parentId: 1 }, { unique: true });
ragParentChunkSchema.index({ collectionName: 1, documentId: 1 });

export default mongoose.model('RagParentChunk', ragParentChunkSchema);
