import express from 'express';
import { removeMemory } from '../controllers/projectBrainController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.delete('/:id', protect, asyncHandler(removeMemory));

export default router;
