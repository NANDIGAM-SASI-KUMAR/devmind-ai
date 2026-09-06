import express from 'express';
import {
  getOverview, getTrend, getTopics, getTopicDetail,
  getQuizAnalytics, getExamAnalytics, getStudyPlanAnalytics, getRecentActivity, getInsights
} from '../controllers/resultsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/overview', getOverview);
router.get('/trend', getTrend);
router.get('/topics', getTopics);
router.get('/topics/:topic', getTopicDetail);
router.get('/quiz-analytics', getQuizAnalytics);
router.get('/exam-analytics', getExamAnalytics);
router.get('/study-plans', getStudyPlanAnalytics);
router.get('/activity', getRecentActivity);
router.get('/insights', getInsights);

export default router;
