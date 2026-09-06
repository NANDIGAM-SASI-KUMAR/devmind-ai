import express from 'express';
import { getQuiz, submitQuiz } from '../controllers/studyQuizController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.use(protect);

router.get('/:id', asyncHandler(getQuiz));
router.post('/:id/submit', asyncHandler(submitQuiz));

export default router;
