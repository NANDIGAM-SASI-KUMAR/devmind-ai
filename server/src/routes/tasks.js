import express from 'express';
import { updateTask, deleteTask } from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.route('/:id').put(protect, asyncHandler(updateTask)).delete(protect, asyncHandler(deleteTask));

export default router;
