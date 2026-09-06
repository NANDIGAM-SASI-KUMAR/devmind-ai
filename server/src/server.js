import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import conversationRoutes from './routes/conversations.js';
import chatRoutes from './routes/chat.js';
import usageRoutes from './routes/usage.js';
import fileRoutes from './routes/files.js';
import studyPlanRoutes from './routes/studyPlans.js';
import taskRoutes from './routes/tasks.js';
import projectBrainRoutes from './routes/projectBrain.js';
import quizRoutes from './routes/quizzes.js';
import notificationRoutes from './routes/notifications.js';
import publicRoutes from './routes/public.js';
import examRoutes from './routes/exams.js';
import recommendationRoutes from './routes/recommendations.js';
import resultsRoutes from './routes/results.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// ---------- Middleware ----------
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// ---------- Health check ----------
app.get('/', (_req, res) => {
  res.json({
    name: 'DevMind API',
    status: 'running',
    version: '1.0.0',
    endpoints: ['/api/auth', '/api/projects', '/api/conversations', '/api/chat', '/api/usage', '/api/files', '/api/study-plans']
  });
});

// ---------- Routes ----------
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/usage', usageRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/study-plans', studyPlanRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/brain', projectBrainRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/results', resultsRoutes);

// ---------- Error handler (must be last) ----------
app.use(errorHandler);

// ---------- Start ----------
const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`\n🚀 DevMind server running on http://localhost:${PORT}`);
      console.log(`📡 API available at http://localhost:${PORT}/api\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    process.exit(1);
  }
};

start();
