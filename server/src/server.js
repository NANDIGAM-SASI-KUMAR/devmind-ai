import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import chatRoutes from './routes/chat.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

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
    endpoints: ['/api/auth', '/api/projects', '/api/chat']
  });
});

// ---------- Routes ----------
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/chat', chatRoutes);

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
