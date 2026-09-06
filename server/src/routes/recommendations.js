import express from 'express';
import { startFollowUp, dismissRecommendation } from '../controllers/examController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/:id/start-followup', startFollowUp);
router.post('/:id/dismiss', dismissRecommendation);

export default router;
