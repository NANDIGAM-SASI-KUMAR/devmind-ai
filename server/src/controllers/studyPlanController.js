import fs from 'fs/promises';
import path from 'path';
import StudyPlan from '../models/StudyPlan.js';
import StudyMaterial from '../models/StudyMaterial.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import Exam from '../models/Exam.js';
import ExamAttempt from '../models/ExamAttempt.js';
import ExamRecommendation from '../models/ExamRecommendation.js';
import RagParentChunk from '../models/RagParentChunk.js';
import { STUDY_UPLOAD_DIR } from '../middleware/studyUpload.js';
import { extractText } from '../utils/documentParser.js';
import {
  deleteMaterialChunks, deleteStudyPlanCollection, queryChunks,
  addStructuredChunks, studyCollectionName
} from '../utils/chroma.js';
import { chunkStructured } from '../rag/chunking.js';
import { runRagPipeline } from '../rag/pipeline.js';
import { askStudyAgent } from '../agents/studyAgent.js';
import { generateStudyPlanFromContext } from '../agents/studyPlanAgent.js';
import { notify } from './notificationController.js';
import { invalidateResultsCache } from './resultsController.js';
import { cached, cacheDelByPrefix } from '../utils/cache.js';

// Pulls a broad, de-duplicated sample of a study plan's indexed material —
// queried per-material-name plus a generic overview query — so generation
// tasks (plan/quiz) see coverage across all uploaded files, not just the
// top matches for one narrow query. Capped by character budget, not chunk count.
export const gatherStudyContext = async (planId, materials, { maxChars = 12000 } = {}) => {
  const seen = new Set();
  const collected = [];
  const queries = [...materials.map((m) => m.originalName), 'key concepts, definitions and topics overview'];

  for (const q of queries) {
    const matches = await queryChunks(planId, q, 8);
    for (const m of matches) {
      if (!seen.has(m.text)) {
        seen.add(m.text);
        collected.push(m);
      }
    }
  }

  let total = 0;
  const bounded = [];
  for (const m of collected) {
    if (total + m.text.length > maxChars) continue;
    bounded.push(m);
    total += m.text.length;
  }
  return bounded;
};

// GET /api/study-plans
export const listStudyPlans = async (req, res) => {
  const plans = await StudyPlan.find({ user: req.user._id }).sort('-updatedAt');
  res.json(plans);
};

// POST /api/study-plans
export const createStudyPlan = async (req, res) => {
  const { name, understandingLevel } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Name is required' });

  const plan = await StudyPlan.create({
    user: req.user._id,
    name: name.trim(),
    understandingLevel: ['beginner', 'intermediate', 'advanced'].includes(understandingLevel) ? understandingLevel : 'beginner'
  });
  res.status(201).json(plan);
};

// GET /api/study-plans/:id
export const getStudyPlan = async (req, res) => {
  const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) return res.status(404).json({ message: 'Study plan not found' });
  res.json(plan);
};

// PUT /api/study-plans/:id
export const updateStudyPlan = async (req, res) => {
  const allowed = {};
  if (typeof req.body.name === 'string' && req.body.name.trim()) allowed.name = req.body.name.trim();
  if (['beginner', 'intermediate', 'advanced'].includes(req.body.understandingLevel)) {
    allowed.understandingLevel = req.body.understandingLevel;
  }
  const plan = await StudyPlan.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, allowed, { new: true });
  if (!plan) return res.status(404).json({ message: 'Study plan not found' });
  res.json(plan);
};

// Deletes everything scoped to a study plan: material files on disk, its Chroma
// collection, and every dependent Mongo collection. Shared by single-plan deletion
// and full account deletion so both stay in sync as new plan-scoped data is added.
export const cascadeDeleteStudyPlanData = async (planId) => {
  const materials = await StudyMaterial.find({ studyPlan: planId });
  await Promise.all(materials.map((m) => fs.unlink(path.join(STUDY_UPLOAD_DIR, m.storedName)).catch(() => {})));
  await StudyMaterial.deleteMany({ studyPlan: planId });
  await deleteStudyPlanCollection(planId);
  await RagParentChunk.deleteMany({ collectionName: studyCollectionName(planId) });
  await Quiz.deleteMany({ studyPlan: planId });
  await QuizAttempt.deleteMany({ studyPlan: planId });
  await Exam.deleteMany({ studyPlan: planId });
  await ExamAttempt.deleteMany({ studyPlan: planId });
  await ExamRecommendation.deleteMany({ studyPlan: planId });
};

// DELETE /api/study-plans/:id
export const deleteStudyPlan = async (req, res) => {
  const plan = await StudyPlan.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!plan) return res.status(404).json({ message: 'Study plan not found' });

  await cascadeDeleteStudyPlanData(plan._id);
  await Promise.all([
    invalidateResultsCache(req.user._id),
    cacheDelByPrefix(`progress:${req.user._id}:${plan._id}`)
  ]);
  res.json({ message: 'Study plan deleted' });
};

// GET /api/study-plans/:id/materials
export const listMaterials = async (req, res) => {
  const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) return res.status(404).json({ message: 'Study plan not found' });

  const materials = await StudyMaterial.find({ studyPlan: plan._id }).sort('-createdAt');
  res.json(materials);
};

// POST /api/study-plans/:id/materials
// Full ingestion pipeline: parse -> chunk -> embed -> store in the vector DB.
export const uploadMaterial = async (req, res) => {
  const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) return res.status(404).json({ message: 'Study plan not found' });
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  const material = await StudyMaterial.create({
    studyPlan: plan._id,
    user: req.user._id,
    originalName: req.file.originalname,
    storedName: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    status: 'processing'
  });

  try {
    const filePath = path.join(STUDY_UPLOAD_DIR, req.file.filename);
    const text = await extractText(filePath, req.file.originalname);
    const { parents, children } = chunkStructured(text);

    if (children.length === 0) {
      material.status = 'failed';
      material.error = 'No extractable text found in this file';
      await material.save();
      return res.status(201).json(material);
    }

    const collectionName = studyCollectionName(plan._id);
    await RagParentChunk.insertMany(
      parents.map((p) => ({
        collectionName,
        documentId: String(material._id),
        parentId: `${material._id}_${p.parentId}`,
        originalName: req.file.originalname,
        heading: p.heading,
        section: p.section,
        text: p.text
      }))
    );
    // Children's parentId must match the RagParentChunk records above exactly.
    await addStructuredChunks(
      plan._id,
      material._id,
      req.file.originalname,
      children.map((c) => ({ ...c, parentId: `${material._id}_${c.parentId}` }))
    );

    material.status = 'ready';
    material.chunkCount = children.length;
    await material.save();
    await cacheDelByPrefix(`rag:ask:${plan._id}:`);
    res.status(201).json(material);
  } catch (err) {
    console.error('Material processing failed:', err);
    material.status = 'failed';
    material.error = 'Could not process this file';
    await material.save();
    res.status(201).json(material);
  }
};

// DELETE /api/study-plans/:id/materials/:materialId
export const deleteMaterial = async (req, res) => {
  const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) return res.status(404).json({ message: 'Study plan not found' });

  const material = await StudyMaterial.findOne({ _id: req.params.materialId, studyPlan: plan._id });
  if (!material) return res.status(404).json({ message: 'Material not found' });

  await fs.unlink(path.join(STUDY_UPLOAD_DIR, material.storedName)).catch(() => {});
  await deleteMaterialChunks(plan._id, material._id);
  await RagParentChunk.deleteMany({ collectionName: studyCollectionName(plan._id), documentId: String(material._id) });
  await material.deleteOne();
  await cacheDelByPrefix(`rag:ask:${plan._id}:`);

  res.json({ message: 'Material deleted' });
};

// GET /api/study-plans/:id/search?q=...
// Exposes raw retrieval so the ingestion pipeline can be verified independent of plan generation.
export const searchMaterials = async (req, res) => {
  const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) return res.status(404).json({ message: 'Study plan not found' });

  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ message: 'Query is required' });

  const results = await queryChunks(plan._id, q, 5);
  res.json({ results });
};

// POST /api/study-plans/:id/ask  { question }
// Full RAG: retrieve relevant chunks, then have the LLM answer directly using them.
export const askQuestion = async (req, res) => {
  const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) return res.status(404).json({ message: 'Study plan not found' });

  const question = (req.body.question || '').trim();
  if (!question) return res.status(400).json({ message: 'Question is required' });

  const readyCount = await StudyMaterial.countDocuments({ studyPlan: plan._id, status: 'ready' });
  if (readyCount === 0) {
    return res.json({ answer: "You haven't uploaded any material for this study plan yet, so I don't have anything to answer from." });
  }

  // Debug mode is opt-in and only ever returns to the requesting user's own plan (already
  // ownership-checked above) — never cached, always run fresh so the trace reflects
  // exactly this request. Cache key is scoped by studyPlan (itself owned per-user), so a
  // cached answer can never be served across users or study plans.
  const debug = req.query.debug === 'true';
  const cacheKey = `rag:ask:${plan._id}:${question.trim().toLowerCase().replace(/\s+/g, ' ')}`;

  const runPipeline = () =>
    runRagPipeline({
      collectionName: studyCollectionName(plan._id),
      query: question,
      generate: (context) => askStudyAgent({ question, context, understandingLevel: plan.understandingLevel }),
      debug
    });

  try {
    const result = debug ? await runPipeline() : await cached(cacheKey, 600, runPipeline);
    res.json({
      answer: result.answer,
      sources: [...new Set(result.citations.map((c) => c.source))],
      citations: result.citations,
      confidence: result.confidence,
      grounded: result.grounded,
      ...(debug ? { debug: result.debug } : {})
    });
  } catch (err) {
    console.error('Study agent failed:', err);
    res.status(500).json({ message: 'Could not generate an answer right now. Please try again.' });
  }
};

// POST /api/study-plans/:id/generate-plan
// Source-grounded weekly curriculum generation over the plan's uploaded material.
export const generatePlan = async (req, res) => {
  const plan = await StudyPlan.findOne({ _id: req.params.id, user: req.user._id });
  if (!plan) return res.status(404).json({ message: 'Study plan not found' });

  const materials = await StudyMaterial.find({ studyPlan: plan._id, status: 'ready' });
  if (materials.length === 0) {
    return res.status(400).json({ message: 'Upload at least one processed material before generating a study plan.' });
  }

  const context = await gatherStudyContext(plan._id, materials);
  if (context.length === 0) {
    return res.status(400).json({ message: 'No indexed content was found for this material yet. Try again shortly.' });
  }

  try {
    const weeks = await generateStudyPlanFromContext({
      context: context.map((c) => c.text).join('\n\n---\n\n'),
      understandingLevel: plan.understandingLevel
    });
    plan.plan = JSON.stringify(weeks);
    plan.planGeneratedAt = new Date();
    await plan.save();

    await invalidateResultsCache(req.user._id);

    await notify(req.user._id, {
      type: 'study_plan_generated',
      title: 'Study plan ready',
      message: plan.name,
      link: `/study-plans/${plan._id}`
    });

    res.json(plan);
  } catch (err) {
    console.error('Study plan generation failed:', err);
    res.status(500).json({ message: err.message || 'Could not generate a study plan right now. Please try again.' });
  }
};
