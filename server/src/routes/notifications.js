import express from 'express';
import { listNotifications, markRead, markAllRead } from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', listNotifications);
router.post('/read-all', markAllRead);
router.post('/:id/read', markRead);

export default router;
