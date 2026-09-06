import express from 'express';
import {
  deleteFile, proposeFileEdit, applyFileEdit, listCheckpoints, restoreCheckpoint
} from '../controllers/fileController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.delete('/:id', protect, asyncHandler(deleteFile));
router.post('/:id/propose', protect, asyncHandler(proposeFileEdit));
router.post('/:id/apply', protect, asyncHandler(applyFileEdit));
router.get('/:id/checkpoints', protect, asyncHandler(listCheckpoints));
router.post('/:id/checkpoints/:checkpointId/restore', protect, asyncHandler(restoreCheckpoint));

export default router;
