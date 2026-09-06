import express from 'express';
import {
  getProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  getMessages
} from '../controllers/projectController.js';
import {
  listConversations,
  createConversation,
  listArchivedConversations
} from '../controllers/conversationController.js';
import { uploadFile, listFiles, searchCode } from '../controllers/fileController.js';
import { listTasks, createTask, createTasksBulk, generateProjectPlan } from '../controllers/taskController.js';
import { listMemory, addMemory } from '../controllers/projectBrainController.js';
import { getGithubConnection } from '../controllers/githubController.js';
import { upload } from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getProjects).post(createProject);
router.route('/:id').get(getProject).put(updateProject).delete(deleteProject);
router.get('/:id/messages', getMessages);

router.route('/:projectId/conversations').get(listConversations).post(createConversation);
router.get('/:projectId/conversations/archived', listArchivedConversations);

router.route('/:projectId/files').get(listFiles).post(upload.single('file'), uploadFile);
router.get('/:projectId/search-code', searchCode);

router.route('/:projectId/tasks').get(listTasks).post(createTask);
router.post('/:projectId/tasks/bulk', createTasksBulk);
router.post('/:projectId/plan', generateProjectPlan);

router.route('/:projectId/brain').get(listMemory).post(addMemory);

router.get('/:id/github', getGithubConnection);

export default router;
