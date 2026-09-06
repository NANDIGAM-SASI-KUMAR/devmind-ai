import express from 'express';
import {
  deleteFile, proposeFileEdit, applyFileEdit, listCheckpoints, restoreCheckpoint
} from '../controllers/fileController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.delete('/:id', protect, deleteFile);
router.post('/:id/propose', protect, proposeFileEdit);
router.post('/:id/apply', protect, applyFileEdit);
router.get('/:id/checkpoints', protect, listCheckpoints);
router.post('/:id/checkpoints/:checkpointId/restore', protect, restoreCheckpoint);

export default router;
