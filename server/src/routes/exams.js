import express from 'express';
import {
  listAllExams, listAllExamHistory, listAllRecommendations,
  getExam, startAttempt, getAttempt, saveAnswer, submitAttempt, getAttemptResult
} from '../controllers/examController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

// Literal routes must be registered before the generic "/:id" route, since Express
// matches in registration order and ":id" would otherwise swallow "history"/"attempts".
router.get('/', listAllExams);
router.get('/history', listAllExamHistory);
router.get('/recommendations', listAllRecommendations);

router.get('/attempts/:id', getAttempt);
router.patch('/attempts/:id/answer', saveAnswer);
router.post('/attempts/:id/submit', submitAttempt);
router.get('/attempts/:id/result', getAttemptResult);

router.get('/:id', getExam);
router.post('/:id/attempts', startAttempt);

export default router;
