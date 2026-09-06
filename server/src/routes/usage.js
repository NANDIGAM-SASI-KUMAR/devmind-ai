import express from 'express';
import { getUsage, getStorage, exportData } from '../controllers/usageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, getUsage);
router.get('/storage', protect, getStorage);
router.get('/export', protect, exportData);

export default router;
