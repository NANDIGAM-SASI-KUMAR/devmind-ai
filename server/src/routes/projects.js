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
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.use(protect);

router.route('/').get(asyncHandler(getProjects)).post(asyncHandler(createProject));
router.route('/:id').get(asyncHandler(getProject)).put(asyncHandler(updateProject)).delete(asyncHandler(deleteProject));
router.get('/:id/messages', asyncHandler(getMessages));

router.route('/:projectId/conversations').get(asyncHandler(listConversations)).post(asyncHandler(createConversation));
router.get('/:projectId/conversations/archived', asyncHandler(listArchivedConversations));

router.route('/:projectId/files').get(asyncHandler(listFiles)).post(upload.single('file'), asyncHandler(uploadFile));
router.get('/:projectId/search-code', asyncHandler(searchCode));

router.route('/:projectId/tasks').get(asyncHandler(listTasks)).post(asyncHandler(createTask));
router.post('/:projectId/tasks/bulk', asyncHandler(createTasksBulk));
router.post('/:projectId/plan', asyncHandler(generateProjectPlan));

router.route('/:projectId/brain').get(asyncHandler(listMemory)).post(asyncHandler(addMemory));

router.get('/:id/github', asyncHandler(getGithubConnection));

export default router;
