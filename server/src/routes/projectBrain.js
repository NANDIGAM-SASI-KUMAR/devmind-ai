import express from 'express';
import { removeMemory } from '../controllers/projectBrainController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.delete('/:id', protect, removeMemory);

export default router;
