import express from 'express';
import { streamChat } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/:projectId', protect, streamChat);

export default router;
