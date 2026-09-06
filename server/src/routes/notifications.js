import express from 'express';
import { listNotifications, markRead, markAllRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.use(protect);

router.get('/', asyncHandler(listNotifications));
router.post('/read-all', asyncHandler(markAllRead));
router.post('/:id/read', asyncHandler(markRead));

export default router;
