import express from 'express';
import {
  listAllExams, listAllExamHistory, listAllRecommendations,
  getExam, startAttempt, getAttempt, saveAnswer, submitAttempt, getAttemptResult
} from '../controllers/examController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.use(protect);

// Literal routes must be registered before the generic "/:id" route, since Express
// matches in registration order and ":id" would otherwise swallow "history"/"attempts".
router.get('/', asyncHandler(listAllExams));
router.get('/history', asyncHandler(listAllExamHistory));
router.get('/recommendations', asyncHandler(listAllRecommendations));

router.get('/attempts/:id', asyncHandler(getAttempt));
router.patch('/attempts/:id/answer', asyncHandler(saveAnswer));
router.post('/attempts/:id/submit', asyncHandler(submitAttempt));
router.get('/attempts/:id/result', asyncHandler(getAttemptResult));

router.get('/:id', asyncHandler(getExam));
router.post('/:id/attempts', asyncHandler(startAttempt));

export default router;
