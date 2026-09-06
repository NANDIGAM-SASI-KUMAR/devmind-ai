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

const router = express.Router();

router.use(protect);

router.get('/trash', listTrash);
router.delete('/trash', emptyTrash);
router.get('/pinned', listPinned);
router.get('/search', searchConversations);

router.route('/:id').get(getConversation).put(updateConversation).delete(trashConversation);
router.post('/:id/restore', restoreConversation);
router.delete('/:id/permanent', permanentlyDeleteConversation);
router.get('/:id/messages', getConversationMessages);

export default router;
