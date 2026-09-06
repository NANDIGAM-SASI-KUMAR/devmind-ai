import express from 'express';
import { streamChat, regenerateMessage, editMessage } from '../controllers/chatController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.post('/:conversationId', protect, asyncHandler(streamChat));
router.post('/:conversationId/regenerate', protect, asyncHandler(regenerateMessage));
router.post('/:conversationId/edit', protect, asyncHandler(editMessage));

export default router;
