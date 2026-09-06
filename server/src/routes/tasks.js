import express from 'express';
import { updateTask, deleteTask } from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.route('/:id').put(protect, updateTask).delete(protect, deleteTask);

export default router;
