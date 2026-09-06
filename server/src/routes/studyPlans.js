import express from 'express';
import {
  listStudyPlans,
  createStudyPlan,
  getStudyPlan,
  updateStudyPlan,
  deleteStudyPlan,
  listMaterials,
  uploadMaterial,
  deleteMaterial,
  searchMaterials,
  askQuestion,
  generatePlan
} from '../controllers/studyPlanController.js';
import { generateQuiz, listQuizzes, getProgress } from '../controllers/studyQuizController.js';
import { createExam, listExams, examHistory, getMastery, listRecommendations } from '../controllers/examController.js';
import { studyUpload } from '../middleware/studyUpload.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.use(protect);

router.route('/').get(asyncHandler(listStudyPlans)).post(asyncHandler(createStudyPlan));
router.route('/:id').get(asyncHandler(getStudyPlan)).put(asyncHandler(updateStudyPlan)).delete(asyncHandler(deleteStudyPlan));
router.route('/:id/materials').get(asyncHandler(listMaterials)).post(studyUpload.single('file'), asyncHandler(uploadMaterial));
router.delete('/:id/materials/:materialId', asyncHandler(deleteMaterial));
router.get('/:id/search', asyncHandler(searchMaterials));
router.post('/:id/ask', asyncHandler(askQuestion));
router.post('/:id/generate-plan', asyncHandler(generatePlan));
router.route('/:id/quizzes').get(asyncHandler(listQuizzes)).post(asyncHandler(generateQuiz));
router.get('/:id/progress', asyncHandler(getProgress));
router.route('/:id/exams').get(asyncHandler(listExams)).post(asyncHandler(createExam));
router.get('/:id/exam-history', asyncHandler(examHistory));
router.get('/:id/mastery', asyncHandler(getMastery));
router.get('/:id/recommendations', asyncHandler(listRecommendations));

export default router;
