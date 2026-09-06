import express from 'express';
import { getQuiz, submitQuiz } from '../controllers/studyQuizController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/:id', getQuiz);
router.post('/:id/submit', submitQuiz);

export default router;
