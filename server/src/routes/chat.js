import express from 'express';
import { streamChat, regenerateMessage, editMessage } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/:conversationId', protect, streamChat);
router.post('/:conversationId/regenerate', protect, regenerateMessage);
router.post('/:conversationId/edit', protect, editMessage);

export default router;
