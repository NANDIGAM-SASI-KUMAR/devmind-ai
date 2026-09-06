import express from 'express';
import {
  getConversation,
  updateConversation,
  trashConversation,
  restoreConversation,
  permanentlyDeleteConversation,
  listTrash,
  emptyTrash,
  listPinned,
  getConversationMessages,
  searchConversations
} from '../controllers/conversationController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.use(protect);

router.get('/trash', asyncHandler(listTrash));
router.delete('/trash', asyncHandler(emptyTrash));
router.get('/pinned', asyncHandler(listPinned));
router.get('/search', asyncHandler(searchConversations));

router.route('/:id').get(asyncHandler(getConversation)).put(asyncHandler(updateConversation)).delete(asyncHandler(trashConversation));
router.post('/:id/restore', asyncHandler(restoreConversation));
router.delete('/:id/permanent', asyncHandler(permanentlyDeleteConversation));
router.get('/:id/messages', asyncHandler(getConversationMessages));

export default router;
