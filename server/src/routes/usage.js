import express from 'express';
import { getUsage, getStorage, exportData } from '../controllers/usageController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.get('/', protect, asyncHandler(getUsage));
router.get('/storage', protect, asyncHandler(getStorage));
router.get('/export', protect, asyncHandler(exportData));

export default router;
