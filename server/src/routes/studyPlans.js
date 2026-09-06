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

const router = express.Router();

router.use(protect);

router.route('/').get(listStudyPlans).post(createStudyPlan);
router.route('/:id').get(getStudyPlan).put(updateStudyPlan).delete(deleteStudyPlan);
router.route('/:id/materials').get(listMaterials).post(studyUpload.single('file'), uploadMaterial);
router.delete('/:id/materials/:materialId', deleteMaterial);
router.get('/:id/search', searchMaterials);
router.post('/:id/ask', askQuestion);
router.post('/:id/generate-plan', generatePlan);
router.route('/:id/quizzes').get(listQuizzes).post(generateQuiz);
router.get('/:id/progress', getProgress);
router.route('/:id/exams').get(listExams).post(createExam);
router.get('/:id/exam-history', examHistory);
router.get('/:id/mastery', getMastery);
router.get('/:id/recommendations', listRecommendations);

export default router;
