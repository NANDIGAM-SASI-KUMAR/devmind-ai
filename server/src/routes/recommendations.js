import express from 'express';
import { startFollowUp, dismissRecommendation } from '../controllers/examController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.use(protect);

router.post('/:id/start-followup', asyncHandler(startFollowUp));
router.post('/:id/dismiss', asyncHandler(dismissRecommendation));

export default router;
