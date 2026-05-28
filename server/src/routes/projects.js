import express from 'express';
import {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  getMessages
} from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getProjects).post(createProject);
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);
router.get('/:id/messages', getMessages);

export default router;
