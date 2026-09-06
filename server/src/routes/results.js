import express from 'express';
import {
  getOverview, getTrend, getTopics, getTopicDetail,
  getQuizAnalytics, getExamAnalytics, getStudyPlanAnalytics, getRecentActivity, getInsights
} from '../controllers/resultsController.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

router.use(protect);

router.get('/overview', asyncHandler(getOverview));
router.get('/trend', asyncHandler(getTrend));
router.get('/topics', asyncHandler(getTopics));
router.get('/topics/:topic', asyncHandler(getTopicDetail));
router.get('/quiz-analytics', asyncHandler(getQuizAnalytics));
router.get('/exam-analytics', asyncHandler(getExamAnalytics));
router.get('/study-plans', asyncHandler(getStudyPlanAnalytics));
router.get('/activity', asyncHandler(getRecentActivity));
router.get('/insights', asyncHandler(getInsights));

export default router;
